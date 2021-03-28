using backend2.HostedServices;
using backend2.Util;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Renci.SshNet;
using StackExchange.Redis;
using supercompose;
using System;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.Intrinsics.Arm;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using backend.Exceptions;
using backend2.Exceptions;
using Renci.SshNet.Common;
using Z.EntityFramework.Plus;

namespace backend2.Services
{
  /// <summary>
  /// This is a core component that performs pending updates for individual nodes
  /// </summary>
  public class NodeUpdaterService
  {
    public static readonly TimeSpan NodeCheckInterval = TimeSpan.FromHours(1);

    private readonly ILogger<NodeUpdaterService> logger;
    private readonly SupercomposeContext ctx;
    private readonly IConnectionMultiplexer multiplexer;
    private readonly ConnectionService connectionService;
    private readonly CryptoService cryptoService;
    private readonly ConnectionLogService connectionLog;

    public NodeUpdaterService(
      ILogger<NodeUpdaterService> logger,
      SupercomposeContext ctx,
      IConnectionMultiplexer multiplexer,
      ConnectionService connectionService,
      CryptoService cryptoService,
      ConnectionLogService connectionLog
    )
    {
      this.logger = logger;
      this.ctx = ctx;
      this.multiplexer = multiplexer;
      this.connectionService = connectionService;
      this.cryptoService = cryptoService;
      this.connectionLog = connectionLog;
    }

    public async Task NotifyAboutNodeChange(Guid nodeId)
    {
      await multiplexer.GetSubscriber().PublishAsync(NodeUpdateListener.ChannelName, nodeId.ToString());
    }

    private bool RedeployRequested(Deployment x)
    {
      var deplRequested = x.RedeploymentRequestedAt != null && x.RedeploymentRequestedAt > x.LastCheck;
      var nodeRequested = x.Node.RedeploymentRequestedAt != null && x.Node.RedeploymentRequestedAt > x.LastCheck;
      var composeRequested = x.LastDeployedComposeVersion?.RedeploymentRequestedAt != null &&
                             x.LastDeployedComposeVersion.RedeploymentRequestedAt > x.LastCheck;

      return deplRequested ||
             nodeRequested ||
             composeRequested;
    }

    private bool HasDeploymentChanged(Deployment x)
    {
      var nodeVersionChanged = x.Node.Version != x.LastDeployedNodeVersion;
      var composeVersionChanged = x.Compose.CurrentId != x.LastDeployedComposeVersionId;
      var lastCheckOutdated = x.LastCheck + NodeCheckInterval < DateTime.UtcNow;

      return nodeVersionChanged || composeVersionChanged || lastCheckOutdated || RedeployRequested(x);
    }

    private bool ShouldUpdateDeployment(Deployment x)
    {
      var deplReconDidntFail = x.ReconciliationFailed != true;
      var enabledChanged = (x.Enabled && x.Node.Enabled) != x.LastDeployedAsEnabled;
      var deploymentUpdateable = enabledChanged || x.Enabled;

      return deplReconDidntFail && deploymentUpdateable && HasDeploymentChanged(x);
    }

    public async Task ProcessNodeUpdates(Guid nodeId, CancellationToken ct)
    {
      try
      {
        while (!ct.IsCancellationRequested)
        {
          var node = await ctx.Nodes
            .Where(x => x.Id == nodeId)
            .Include(x => x.Deployments)
            .ThenInclude(x => x.Compose)
            .ThenInclude(x => x.Current)
            .Include(x => x.Deployments)
            .ThenInclude(x => x.LastDeployedComposeVersion)
            .FirstOrDefaultAsync(ct);

          if (node == null) throw new NodeNotFoundException();

          var deployments = node.Deployments.Where(ShouldUpdateDeployment).ToList();
          if (!deployments.Any()) return;

          using var ssh = await OpenSsh(node, ct);

          if (deployments.Any(x => x.LastDeployedNodeVersion != node.Version))
            if (!await VerifyNode(node, ssh, ct))
              return;

          using var sftp = await OpenSftp(node, ct);

          foreach (var deployment in deployments) await ApplyDeployment(deployment, ssh, sftp, ct);
        }
      }
      catch (TaskCanceledException)
      {
      }
      catch (NodeReconciliationFailedException ex)
      {
        logger.LogInformation("Node reconciliation failed {why}", ex.Message);
        connectionLog.Error("Node reconciliation failed", ex);
        await ctx.Nodes.Where(x => x.Id == nodeId).UpdateAsync(x => new Node {ReconciliationFailed = true}, ct);
      }
      catch (NodeConnectionFailedException ex)
      {
        logger.LogInformation("Node reconciliation failed {why}", ex.Message);
        connectionLog.Error($"Node connection failed", ex);
        await ctx.Nodes.Where(x => x.Id == nodeId).UpdateAsync(x => new Node {ReconciliationFailed = true}, ct);
      }
      catch (SshException ex)
      {
        logger.LogInformation("Node reconciliation failed {why}", ex.Message);
        connectionLog.Error($"SSH error", ex);
        await ctx.Nodes.Where(x => x.Id == nodeId).UpdateAsync(x => new Node {ReconciliationFailed = true}, ct);
      }
      catch (Exception ex)
      {
        logger.LogError(ex, "Unknown error when reconciling node {nodeId}", nodeId);
        connectionLog.Error($"Unknown error", ex);

        await ctx.Nodes.Where(x => x.Id == nodeId).UpdateAsync(x => new Node {ReconciliationFailed = true}, ct);
      }
    }

    private async Task<SshClient> OpenSsh(Node node, CancellationToken ct)
    {
      logger.LogDebug("Pending changes detected, opening ssh connection");

      var connectionParams = new ConnectionParams
      (
        node.Host,
        node.Username,
        node.Port!.Value,
        node.Password == null ? null : await cryptoService.DecryptSecret(node.Password),
        node.PrivateKey == null ? null : await cryptoService.DecryptSecret(node.PrivateKey)
      );

      connectionLog.Info($"Connecting SSH to {node.Username}@{node.Host}:{node.Port}");
      var ssh = await connectionService.CreateSshConnection(connectionParams, TimeSpan.FromSeconds(10), ct);

      ct.ThrowIfCancellationRequested();

      return ssh;
    }

    private async Task<SftpClient> OpenSftp(Node node, CancellationToken ct)
    {
      logger.LogDebug("Pending changes detected, opening sftp connection");

      var connectionParams = new ConnectionParams
      (
        node.Host,
        node.Username,
        node.Port!.Value,
        node.Password == null ? null : await cryptoService.DecryptSecret(node.Password),
        node.PrivateKey == null ? null : await cryptoService.DecryptSecret(node.PrivateKey)
      );

      connectionLog.Info($"Connecting SFTP to {node.Username}@{node.Host}:{node.Port}");
      var sftp = await connectionService.CreateSftpConnection(connectionParams, TimeSpan.FromSeconds(10), ct);

      ct.ThrowIfCancellationRequested();

      return sftp;
    }

    private async Task<(string result, string error, int status)> RunCommand(SshClient ssh, string command,
      CancellationToken ct)
    {
      connectionLog.Info($"Running command: {command}");

      var result = await connectionService.RunCommand(ssh, command, TimeSpan.FromSeconds(10), ct);

      if (result.status != 0) connectionLog.Info($"Command failed with status: {result.status}");

      return result;
    }

    private async Task<bool> VerifyNode(Node node, SshClient ssh, CancellationToken ct)
    {
      connectionLog.Info("Verifying node");

      var systemctlVersion = await RunCommand(ssh, "systemctl --version", ct);
      if (systemctlVersion.status != 0)
      {
        logger.LogDebug("systemd unavailable");
        throw new NodeReconciliationFailedException("systemd unavailable, stopping node configuration");
      }

      var dockerVersion = await RunCommand(ssh, "docker --version", ct);
      if (dockerVersion.status != 0)
      {
        logger.LogDebug("docker unavailable");
        connectionLog.Error("docker unavailable, stopping node configuration");
        throw new NodeReconciliationFailedException("docker unavailable, stopping node configuration");
      }

      var dockerComposeVersion = await RunCommand(ssh, "docker-compose --version", ct);
      if (dockerComposeVersion.status != 0)
      {
        logger.LogDebug("docker-compose unavailable");
        connectionLog.Error("docker-compose unavailable, stopping node configuration");
        throw new NodeReconciliationFailedException("docker-compose unavailable, stopping node configuration");
      }

      return true;
    }


    private async Task UpdateFile(SftpClient sftp, string path, string contents, CancellationToken ct)
    {
      connectionLog.Info($"Reading file {path}");
      var targetBytes = Encoding.UTF8.GetBytes(contents.Replace("\r\n", "\n"));

      var shouldWrite = true;
      try
      {
        var current = await connectionService.ReadFile(sftp, path, ct);
        shouldWrite = !current.SequenceEqual(targetBytes);
      }
      catch (SftpPathNotFoundException)
      {
      }

      if (shouldWrite)
      {
        connectionLog.Info($"File outdated, updating {path}");
        await connectionService.WriteFile(sftp, path, targetBytes);
      }
    }

    private async Task ApplyDeployment(Deployment deployment, SshClient ssh, SftpClient sftp, CancellationToken ct)
    {
      // TODO cleanup current version
      using var _ = connectionLog.BeginScope(deploymentId: deployment.Id);

      try
      {
        var (target, last) = CalculateDeploymentState(deployment);

        await EnsureComposeAndServiceDeployment(deployment, ssh, sftp, ct);
        await EnsureServiceInCorrectState(deployment, ssh, ct);
        await EnsureRestarted(deployment, ssh, ct);

        deployment.LastDeployedComposeVersionId = deployment.Compose.CurrentId;
        deployment.LastDeployedNodeVersion = deployment.Node.Version;
        deployment.LastCheck = DateTime.UtcNow;
        deployment.LastDeployedAsEnabled = target.DeploymentEnabled;
        await ctx.SaveChangesAsync(ct);

        connectionLog.Info($"Deployment applied successfully");
      }
      catch (DeploymentReconciliationFailedException ex)
      {
        connectionLog.Error($"Deployment reconciliation failed", ex);
        deployment.ReconciliationFailed = true;
        await ctx.SaveChangesAsync(ct);
      }
    }

    private record DeploymentState(bool DeploymentEnabled, bool UseService);

    private (DeploymentState target, DeploymentState lastApplied) CalculateDeploymentState(Deployment deployment)
    {
      var last = deployment.LastDeployedComposeVersion;
      var current = deployment.Compose.Current;

      var lastSvc = last?.ServiceEnabled ?? false;
      var lastEnabled = deployment?.LastDeployedAsEnabled ?? false;

      var targetService = current?.ServiceEnabled ?? false;
      var targetEnabled = deployment.Enabled && deployment.Node.Enabled;

      return (
        new DeploymentState(targetEnabled, targetService),
        new DeploymentState(lastEnabled, lastSvc)
      );
    }

    private async Task EnsureComposeAndServiceDeployment(Deployment deployment, SshClient ssh, SftpClient sftp,
      CancellationToken ct)
    {
      var targetCompose = deployment.Compose.Current;

      var (target, last) = CalculateDeploymentState(deployment);

      await EnsureDockerCompose(deployment, sftp, targetCompose, ct);

      if (target.UseService) await EnsureSystemdService(deployment, ssh, sftp, targetCompose, ct);
    }

    private async Task EnsureDockerCompose(Deployment deployment, SftpClient sftp,
      ComposeVersion targetCompose, CancellationToken ct)
    {
      try
      {
        connectionLog.Info($"Ensuring directory exists {targetCompose.Directory}");
        await connectionService.EnsureDirectoryExists(sftp, targetCompose.Directory, ct);
        ct.ThrowIfCancellationRequested();
      }
      catch (SftpPermissionDeniedException ex)
      {
        throw new DeploymentReconciliationFailedException("Docker compose folder creation failed", ex);
      }


      try
      {
        connectionLog.Info($"Updating docker-compose.yml");
        await UpdateFile(sftp, targetCompose.ComposePath, targetCompose.Content, ct);
      }
      catch (SftpPermissionDeniedException ex)
      {
        throw new DeploymentReconciliationFailedException(
          "Docker-compose.yml synchronization failed due to permission error", ex);
      }
    }

    private async Task EnsureSystemdService(Deployment deployment, SshClient ssh, SftpClient sftp,
      ComposeVersion targetCompose, CancellationToken ct)
    {
      try
      {
        var serviceFile = await GenerateSystemdServiceFile(deployment, ssh, ct);
        connectionLog.Info($"Updating systemd service");
        await UpdateFile(sftp, targetCompose.ServicePath, serviceFile, ct);
        ct.ThrowIfCancellationRequested();

        var reloadResult = await RunCommand(ssh, "systemctl daemon-reload", ct);

        if (reloadResult.status != 0)
          throw new DeploymentReconciliationFailedException(
            $"Systemd service reload failed with code  {reloadResult.status}");
      }
      catch (SftpPermissionDeniedException ex)
      {
        throw new DeploymentReconciliationFailedException(
          "Systemd service failed to be synchronized due to permission error", ex);
      }
    }

    private async Task EnsureServiceInCorrectState(Deployment deployment, SshClient ssh, CancellationToken ct)
    {
      var lastCompose = deployment.LastDeployedComposeVersion;
      var targetCompose = deployment.Compose.Current;

      var (target, last) = CalculateDeploymentState(deployment);

      if (lastCompose == null)
      {
        if (target.DeploymentEnabled)
        {
          if (target.UseService)
            await StartSystemdService(deployment, targetCompose, ssh, ct);
          else
            await StartDockerCompose(deployment, targetCompose, ssh, ct);
        }
      }
      else
      {
        // Stop last state when it was enabled and there is a change in service
        if (last.DeploymentEnabled && last.UseService != target.UseService)
        {
          if (last.UseService)
            await StopSystemdService(deployment, lastCompose, ssh, ct);
          else
            await StopDockerCompose(deployment, targetCompose, ssh, ct);
        }

        if (target.DeploymentEnabled)
        {
          // We don't have to worry about the old state at this point. Only redeploy if there are changes.
          if (target.UseService) await StartSystemdService(deployment, targetCompose, ssh, ct);
          else await StartDockerCompose(deployment, targetCompose, ssh, ct);
        }
        else
        {
          if (target.UseService) await StopSystemdService(deployment, targetCompose, ssh, ct);
          else await StopDockerCompose(deployment, targetCompose, ssh, ct);
        }
      }
    }

    private async Task EnsureRestarted(Deployment deployment, SshClient ssh, CancellationToken ct)
    {
      if (RedeployRequested(deployment))
      {
        var (target, last) = CalculateDeploymentState(deployment);

        if (target.UseService)
          await RestartSystemdService(deployment, deployment.Compose.Current, ssh, ct);
        else
          await RestartDockerCompose(deployment, deployment.Compose.Current, ssh, ct);
      }
    }

    private async Task RestartSystemdService(Deployment deployment, ComposeVersion compose, SshClient ssh,
      CancellationToken ct)
    {
      var serviceStartResult =
        await RunCommand(ssh, $"systemctl restart {compose.ServiceName}", ct);

      if (serviceStartResult.status != 0)
        throw new DeploymentReconciliationFailedException("Systemd service failed to restart");
    }

    private async Task RestartDockerCompose(Deployment deployment, ComposeVersion compose, SshClient ssh,
      CancellationToken ct)
    {
      var startCommand =
        await RunCommand(ssh, $"/usr/local/bin/docker-compose --file '{compose.ComposePath}' restart", ct);

      if (startCommand.status != 0)
        throw new DeploymentReconciliationFailedException($"Docker-compose failed to restart");
    }

    private async Task StopSystemdService(Deployment deployment, ComposeVersion compose, SshClient ssh,
      CancellationToken ct)
    {
      var serviceStartResult =
        await RunCommand(ssh, $"systemctl stop {compose.ServiceName}", ct);

      if (serviceStartResult.status != 0)
        throw new DeploymentReconciliationFailedException("Systemd service failed to stop");

      var serviceEnableResult =
        await RunCommand(ssh, $"systemctl disable {compose.ServiceName}", ct);

      if (serviceEnableResult.status != 0)
        throw new DeploymentReconciliationFailedException("Systemd service failed to be disabled");
    }

    private async Task StartSystemdService(Deployment deployment, ComposeVersion compose, SshClient ssh,
      CancellationToken ct)
    {
      var serviceStartResult =
        await RunCommand(ssh, $"systemctl start {compose.ServiceName}", ct);

      if (serviceStartResult.status != 0)
        throw new DeploymentReconciliationFailedException("Systemd service failed to start");

      var serviceEnableResult =
        await RunCommand(ssh, $"systemctl enable {compose.ServiceName}", ct);

      if (serviceEnableResult.status != 0)
        throw new DeploymentReconciliationFailedException("Systemd service failed to be enabled");
    }

    private async Task StopDockerCompose(Deployment deployment, ComposeVersion compose, SshClient ssh,
      CancellationToken ct)
    {
      var startCommand =
        await RunCommand(ssh, $"/usr/local/bin/docker-compose --file '{compose.ComposePath}' down", ct);

      if (startCommand.status != 0)
        throw new DeploymentReconciliationFailedException($"Docker-compose failed to stop");
    }

    private async Task StartDockerCompose(Deployment deployment, ComposeVersion compose, SshClient ssh,
      CancellationToken ct)
    {
      var startCommand =
        await RunCommand(ssh, $"/usr/local/bin/docker-compose --file '{compose.ComposePath}' up -d --remove-orphans",
          ct);

      if (startCommand.status != 0)
        throw new DeploymentReconciliationFailedException("Docker-compose failed to start");
    }

    private async Task<string> GenerateSystemdServiceFile(Deployment deployment, SshClient ssh, CancellationToken ct)
    {
      var whichDockerCompose = await RunCommand(ssh, "which docker-compose", ct);
      if (whichDockerCompose.status != 0)
      {
        connectionLog.Error("Could not resolve docker-compose location which is needed for systemd service");
        throw new NodeReconciliationFailedException("Could not resolve docker-compose location");
      }

      var dockerComposeLocation = whichDockerCompose.result.Trim();

      return $@"
[Unit]
Description={deployment.Compose.Name} service with docker compose managed by supercompose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
WorkingDirectory={deployment.Compose.Current.Directory}
ExecStart={dockerComposeLocation} up -d --remove-orphans
ExecStop={dockerComposeLocation} down

[Install]
WantedBy=multi-user.target".Trim().Replace("\r\n", "\n");
    }
  }
}