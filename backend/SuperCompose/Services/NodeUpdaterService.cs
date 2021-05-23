using SuperCompose.HostedServices;
using SuperCompose.Util;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Renci.SshNet;
using StackExchange.Redis;
using System;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.Intrinsics.Arm;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using SuperCompose.Exceptions;
using Renci.SshNet.Common;
using SuperCompose.Context;
using Z.EntityFramework.Plus;

namespace SuperCompose.Services
{
  /// <summary>
  /// This is a core component that performs pending updates for individual nodes
  /// </summary>
  public class NodeUpdaterService
  {
    public static readonly TimeSpan NodeCheckInterval = TimeSpan.FromHours(1);

    private readonly ILogger<NodeUpdaterService> logger;
    private readonly SuperComposeContext ctx;
    private readonly IConnectionMultiplexer multiplexer;
    private readonly ConnectionService connectionService;
    private readonly CryptoService cryptoService;
    private readonly ConnectionLogService connectionLog;
    private readonly ProxyClient proxyClient;
    private readonly IMemoryCache cache;

    public NodeUpdaterService(
      ILogger<NodeUpdaterService> logger,
      SuperComposeContext ctx,
      IConnectionMultiplexer multiplexer,
      ConnectionService connectionService,
      CryptoService cryptoService,
      ConnectionLogService connectionLog,
      ProxyClient proxyClient,
      IMemoryCache cache
    )
    {
      this.logger = logger;
      this.ctx = ctx;
      this.multiplexer = multiplexer;
      this.connectionService = connectionService;
      this.cryptoService = cryptoService;
      this.connectionLog = connectionLog;
      this.proxyClient = proxyClient;
      this.cache = cache;
    }

    public async Task NotifyAboutNodeChange(Guid nodeId)
    {
      await multiplexer.GetSubscriber().PublishAsync(NodeUpdateListener.ChannelName, nodeId.ToString());
    }

    private bool RedeployRequested(Deployment x)
    {
      var deplRequested = x.RedeploymentRequestedAt != null && x.RedeploymentRequestedAt > x.LastCheck;
      var nodeRequested = x.Node!.RedeploymentRequestedAt != null && x.Node.RedeploymentRequestedAt > x.LastCheck;
      var composeRequested = x.LastDeployedComposeVersion?.RedeploymentRequestedAt != null &&
                             x.LastDeployedComposeVersion.RedeploymentRequestedAt > x.LastCheck;

      return deplRequested ||
             nodeRequested ||
             composeRequested;
    }

    private bool HasDeploymentChanged(Deployment x)
    {
      var nodeVersionChanged = x.Node!.Version != x.LastDeployedNodeVersion;
      var composeVersionChanged = x.Compose!.CurrentId != x.LastDeployedComposeVersionId;
      var lastCheckOutdated = x.LastCheck + NodeCheckInterval < DateTime.UtcNow;

      return nodeVersionChanged || composeVersionChanged || lastCheckOutdated || RedeployRequested(x);
    }

    private bool ShouldUpdateDeployment(Deployment x)
    {
      var deplReconDidntFail = x.ReconciliationFailed != true;
      var enabledChanged = (x.Enabled && x.Node.Enabled) != x.LastDeployedAsEnabled;
      var deploymentUpdateable = enabledChanged || x.Enabled && HasDeploymentChanged(x);

      return deplReconDidntFail && deploymentUpdateable;
    }

    public async Task ProcessNodeUpdates(Guid nodeId, CancellationToken ct)
    {
      var tenantId = await ctx.Nodes
        .Where(x => x.Id == nodeId)
        .Select(x => x.TenantId)
        .FirstOrDefaultAsync(ct);
      
      using var _ = connectionLog.BeginScope(tenantId: tenantId, nodeId: nodeId);
      using var _2 = logger.BeginScope(new {nodeId});
      
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

          // using var ssh = await OpenSsh(node, ct);

          var connectionParams = await GetCredentials(node);


          if (deployments.Any(x => x.LastDeployedNodeVersion != node.Version))
            if (!await VerifyNode(connectionParams, ct))
              return;

          // using var sftp = await OpenSftp(node, ct);


          foreach (var deployment in deployments) await ApplyDeployment(connectionParams, deployment, ct);
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
        logger.LogWarning(ex, "Unknown error when reconciling node {nodeId}", nodeId);
        connectionLog.Error($"Unknown error", ex);

        await ctx.Nodes.Where(x => x.Id == nodeId).UpdateAsync(x => new Node {ReconciliationFailed = true}, ct);

        throw;
      }
    }

    private async Task<ConnectionParams> GetCredentials(Node node)
    {
      return new ConnectionParams
      (
        node.Host,
        node.Username,
        node.Port,
        node.Password == null ? null : await cryptoService.DecryptSecret(node.Password),
        node.PrivateKey == null ? null : await cryptoService.DecryptSecret(node.PrivateKey)
      );
    }

    // private async Task<SshClient> OpenSsh(Node node, CancellationToken ct)
    // {
    //   logger.LogDebug("Pending changes detected, opening ssh connection");
    //
    //   var connectionParams = await GetCredentials(node);
    //
    //   connectionLog.Info($"Connecting SSH to {node.Username}@{node.Host}:{node.Port}");
    //   var ssh = await connectionService.CreateSshConnection(connectionParams, TimeSpan.FromSeconds(10), ct);
    //
    //   ct.ThrowIfCancellationRequested();
    //
    //   return ssh;
    // }
    //
    // private async Task<SftpClient> OpenSftp(Node node, CancellationToken ct)
    // {
    //   logger.LogDebug("Pending changes detected, opening sftp connection");
    //
    //   var connectionParams = await GetCredentials(node);
    //
    //   connectionLog.Info($"Connecting SFTP to {node.Username}@{node.Host}:{node.Port}");
    //   var sftp = await connectionService.CreateSftpConnection(connectionParams, TimeSpan.FromSeconds(10), ct);
    //
    //   ct.ThrowIfCancellationRequested();
    //
    //   return sftp;
    // }

    private async Task<bool> VerifyNode(ConnectionParams credentials, CancellationToken ct)
    {
      connectionLog.Info("Verifying node");

      var systemctlVersion = await proxyClient.RunCommand(credentials, "systemctl --version", ct);
      if (systemctlVersion.Code != 0)
      {
        logger.LogDebug("systemd unavailable");
        throw new NodeReconciliationFailedException("systemd unavailable, stopping node configuration");
      }

      var dockerVersion = await proxyClient.RunCommand(credentials, "docker --version", ct);
      if (dockerVersion.Code != 0)
      {
        logger.LogDebug("docker unavailable");
        connectionLog.Error("docker unavailable, stopping node configuration");
        throw new NodeReconciliationFailedException("docker unavailable, stopping node configuration");
      }

      var dockerComposeVersion = await proxyClient.RunCommand(credentials, "docker-compose --version", ct);
      if (dockerComposeVersion.Code != 0)
      {
        logger.LogDebug("docker-compose unavailable");
        connectionLog.Error("docker-compose unavailable, stopping node configuration");
        throw new NodeReconciliationFailedException("docker-compose unavailable, stopping node configuration");
      }

      return true;
    }


    // private async Task UpdateFile(SftpClient sftp, string path, string contents, CancellationToken ct)
    // {
    //   connectionLog.Info($"Reading file {path}");
    //   var targetBytes = Encoding.UTF8.GetBytes(contents.Replace("\r\n", "\n"));
    //
    //   var shouldWrite = true;
    //   try
    //   {
    //     var current = await connectionService.ReadFile(sftp, path, ct);
    //     shouldWrite = !current.SequenceEqual(targetBytes);
    //   }
    //   catch (SftpPathNotFoundException)
    //   {
    //   }
    //
    //   if (shouldWrite)
    //   {
    //     connectionLog.Info($"File outdated, updating {path}");
    //     await connectionService.WriteFile(sftp, path, targetBytes);
    //   }
    // }

    private async Task ApplyDeployment(ConnectionParams credentials, Deployment deployment, CancellationToken ct)
    {
      // TODO cleanup current version
      using var _ = connectionLog.BeginScope(tenantId: deployment.TenantId, deploymentId: deployment.Id);

      try
      {
        var (target, last) = CalculateDeploymentState(deployment);

        await EnsureComposeAndServiceDeployment(credentials, deployment, ct);
        await EnsureServiceInCorrectState(credentials, deployment, ct);
        await EnsureRestarted(credentials, deployment, ct);

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

    private async Task EnsureComposeAndServiceDeployment(ConnectionParams credentials, Deployment deployment, CancellationToken ct)
    {
      var targetCompose = deployment.Compose.Current;

      var (target, last) = CalculateDeploymentState(deployment);
      await proxyClient.UpsertFile(credentials, targetCompose.ComposePath, targetCompose.Content, true, ct);

      // await EnsureDockerCompose(deployment, sftp, targetCompose, ct);

      if (target.UseService) await EnsureSystemdService(credentials, deployment, targetCompose, ct);
    }

    // private async Task EnsureDockerCompose(Deployment deployment, SftpClient sftp,
    //   ComposeVersion targetCompose, CancellationToken ct)
    // {
    //   try
    //   {
    //     connectionLog.Info($"Ensuring directory exists {targetCompose.Directory}");
    //     await connectionService.EnsureDirectoryExists(sftp, targetCompose.Directory, ct);
    //     ct.ThrowIfCancellationRequested();
    //   }
    //   catch (SftpPermissionDeniedException ex)
    //   {
    //     throw new DeploymentReconciliationFailedException("Docker compose folder creation failed", ex);
    //   }
    //
    //
    //   try
    //   {
    //     connectionLog.Info($"Updating docker-compose.yml");
    //     await UpdateFile(sftp, targetCompose.ComposePath, targetCompose.Content, ct);
    //   }
    //   catch (SftpPermissionDeniedException ex)
    //   {
    //     throw new DeploymentReconciliationFailedException(
    //       "Docker-compose.yml synchronization failed due to permission error", ex);
    //   }
    // }

    private async Task EnsureSystemdService(ConnectionParams credentials, Deployment deployment, ComposeVersion targetCompose, CancellationToken ct)
    {
      try
      {
        var serviceFile = await GenerateSystemdServiceFile(credentials, deployment, ct);
        connectionLog.Info($"Updating systemd service");
        await proxyClient.UpsertFile(credentials, targetCompose.ServicePath, Encoding.UTF8.GetBytes(serviceFile), false, ct);
        await proxyClient.SystemdReload(credentials, ct);
      }
      catch (SftpPermissionDeniedException ex)
      {
        throw new DeploymentReconciliationFailedException(
          "Systemd service failed to be synchronized due to permission error", ex);
      }
    }

    private async Task EnsureServiceInCorrectState(ConnectionParams credentials, Deployment deployment, CancellationToken ct)
    {
      var lastCompose = deployment.LastDeployedComposeVersion;
      var targetCompose = deployment.Compose.Current;

      var (target, last) = CalculateDeploymentState(deployment);

      if (lastCompose == null)
      {
        if (target.DeploymentEnabled)
        {
          if (target.UseService)
          {
            await proxyClient.SystemdStartService(credentials, targetCompose.ServiceName + ".service", ct);
            await proxyClient.SystemdEnableService(credentials, targetCompose.ServiceName + ".service", ct);
            await proxyClient.SystemdReload(credentials, ct);
          }
          else
            await StartDockerCompose(credentials, targetCompose, ct);
        }
      }
      else
      {
        // Stop last state when it was enabled and there is a change in service
        if (last.DeploymentEnabled && last.UseService != target.UseService)
        {
          if (last.UseService)
          {
            await proxyClient.SystemdStopService(credentials, lastCompose.ServiceName + ".service", ct);
            await proxyClient.SystemdDisableService(credentials, lastCompose.ServiceName + ".service", ct);
            await proxyClient.SystemdReload(credentials, ct);
          }
          else
            await StopDockerCompose(credentials, targetCompose, ct);
        }

        if (target.DeploymentEnabled)
        {
          // We don't have to worry about the old state at this point. Only redeploy if there are changes.
          if (target.UseService)
          {
            await proxyClient.SystemdStartService(credentials, targetCompose.ServiceName + ".service", ct);
            await proxyClient.SystemdEnableService(credentials, targetCompose.ServiceName + ".service", ct);
            await proxyClient.SystemdReload(credentials, ct);
          }
          else await StartDockerCompose(credentials, targetCompose, ct);
        }
        else
        {
          if (target.UseService)
          {
            await proxyClient.SystemdStopService(credentials, targetCompose.ServiceName + ".service", ct);
            await proxyClient.SystemdDisableService(credentials, targetCompose.ServiceName + ".service", ct);
            await proxyClient.SystemdReload(credentials, ct);
          }
          else await StopDockerCompose(credentials, targetCompose, ct);
        }
      }
    }

    private async Task EnsureRestarted(ConnectionParams credentials, Deployment deployment, CancellationToken ct)
    {
      if (RedeployRequested(deployment))
      {
        var (target, last) = CalculateDeploymentState(deployment);

        if (target.UseService)
          await proxyClient.SystemdRestartService(credentials, deployment.Compose!.Current.ServiceName + ".service", ct);
        else
          await RestartDockerCompose(credentials, deployment.Compose.Current, ct);
      }
    }

    private record DockerComposeCredentials(ConnectionParams Credentials);

    private async Task<string> GetDockerComposePath(ConnectionParams credentials, CancellationToken ct = default)
    {
      return await cache.GetOrCreateAsync(new DockerComposeCredentials(credentials), async entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(1);
        var cred = entry.Key as DockerComposeCredentials ?? throw new InvalidOperationException();


        var result = await proxyClient.RunCommand(cred.Credentials, "which docker-compose", ct);

        if (string.IsNullOrEmpty(result.Error) && result.Code == 0 && result.Stdout != null)
        {
          return Encoding.UTF8.GetString(result.Stdout).Trim();
        }
        else
        {
          throw new DeploymentReconciliationFailedException("Unable to find docker-compose");
        }
      });
    }
    
    private async Task RestartDockerCompose(ConnectionParams credentials, ComposeVersion compose, CancellationToken ct)
    {
      var composePath = await GetDockerComposePath(credentials, ct);
      await proxyClient.RunCommand(credentials, $"{composePath} --file '{compose.ComposePath}' restart", ct);
    }

    private async Task StopDockerCompose(ConnectionParams credentials,ComposeVersion compose, CancellationToken ct)
    {
      var composePath = await GetDockerComposePath(credentials, ct);
      await proxyClient.RunCommand(credentials, $"{composePath} --file '{compose.ComposePath}' down", ct);
    }

    private async Task StartDockerCompose(ConnectionParams credentials, ComposeVersion compose, CancellationToken ct)
    {
      var composePath = await GetDockerComposePath(credentials, ct);
      await proxyClient.RunCommand(credentials, $"{composePath} --file '{compose.ComposePath}'  up -d --remove-orphans", ct);
    }

    private async Task<string> GenerateSystemdServiceFile(ConnectionParams credentials, Deployment deployment, CancellationToken ct)
    {
      var composePath = await GetDockerComposePath(credentials, ct);

      return $@"
[Unit]
Description={deployment.Compose.Name} service with docker compose managed by supercompose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
Environment=""COMPOSE_PROJECT_NAME={deployment.Compose.Current.ServiceName}""
Environment=""COMPOSE_FILE={deployment.Compose.Current.Directory}/docker-compose.yml""
WorkingDirectory={deployment.Compose.Current.Directory}
ExecStart={composePath} --project-directory ""{deployment.Compose.Current.Directory}"" --project-name ""{deployment.Compose.Current.ServiceName}"" up -d --remove-orphans
ExecStop={composePath} down

[Install]
WantedBy=multi-user.target".Trim().Replace("\r\n", "\n");
    }
  }
}