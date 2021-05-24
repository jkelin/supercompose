using SuperCompose.HostedServices;
using SuperCompose.Util;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Renci.SshNet;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.Intrinsics.Arm;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using OpenTelemetry.Trace;
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
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProcessNodeUpdates");
      var tenantId = await ctx.Nodes
        .Where(x => x.Id == nodeId)
        .Select(x => x.TenantId)
        .FirstOrDefaultAsync(ct);

      activity?.AddTag("supercompose.tenantid", tenantId.ToString());
      activity?.AddBaggage("supercompose.tenantid", tenantId.ToString());
      
      using var _ = connectionLog.BeginScope(tenantId: tenantId, nodeId: nodeId);
      using var _2 = logger.BeginScope(new {nodeId});
      
      try
      {
        while (!ct.IsCancellationRequested)
        {
          Node? node;
          using (Extensions.SuperComposeActivitySource.StartActivity("Node with details query"))
          {
            node = await ctx.Nodes
              .Where(x => x.Id == nodeId)
              .Include(x => x.Deployments)
              .ThenInclude(x => x.Compose)
              .ThenInclude(x => x.Current)
              .Include(x => x.Deployments)
              .ThenInclude(x => x.LastDeployedComposeVersion)
              .FirstOrDefaultAsync(ct);
          }

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
        activity.RecordException(ex);
      }
      catch (NodeConnectionFailedException ex)
      {
        logger.LogInformation("Node reconciliation failed {why}", ex.Message);
        connectionLog.Error($"Node connection failed", ex);
        await ctx.Nodes.Where(x => x.Id == nodeId).UpdateAsync(x => new Node {ReconciliationFailed = true}, ct);
        activity.RecordException(ex);
      }
      catch (SshException ex)
      {
        logger.LogInformation("Node reconciliation failed {why}", ex.Message);
        connectionLog.Error($"SSH error", ex);
        await ctx.Nodes.Where(x => x.Id == nodeId).UpdateAsync(x => new Node {ReconciliationFailed = true}, ct);
        activity.RecordException(ex);
      }
      catch (Exception ex)
      {
        logger.LogWarning(ex, "Unknown error when reconciling node {nodeId}", nodeId);
        connectionLog.Error($"Unknown error", ex);

        await ctx.Nodes.Where(x => x.Id == nodeId).UpdateAsync(x => new Node {ReconciliationFailed = true}, ct);

        activity.RecordException(ex);
        
        throw;
      }
    }

    private async Task<ConnectionParams> GetCredentials(Node node)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("Get credentials for node");
      return new ConnectionParams
      (
        node.Host,
        node.Username,
        node.Port,
        node.Password == null ? null : await cryptoService.DecryptSecret(node.Password),
        node.PrivateKey == null ? null : await cryptoService.DecryptSecret(node.PrivateKey)
      );
    }

    private async Task<bool> VerifyNode(ConnectionParams credentials, CancellationToken ct)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("Verify node");
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

    private async Task ApplyDeployment(ConnectionParams credentials, Deployment deployment, CancellationToken ct)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ApplyDeployment");
      activity?.AddTag("supercompose.deploymentid", deployment.Id.ToString());
      activity?.AddBaggage("supercompose.deploymentid", deployment.Id.ToString());
      
      // TODO cleanup current version
      using var _ = connectionLog.BeginScope(tenantId: deployment.TenantId, deploymentId: deployment.Id);
      
      try
      {
        var (target, last) = CalculateDeploymentDiff(deployment);
        activity?.AddTag("deployment.target.enabled", target.DeploymentEnabled);
        activity?.AddTag("deployment.target.service", target.UseService);
        activity?.AddTag("deployment.target.service_path", target.ServicePath);
        activity?.AddTag("deployment.target.compose_path", target.ComposePath);

        activity?.AddTag("deployment.last.enabled", last.DeploymentEnabled);
        activity?.AddTag("deployment.last.service", last.UseService);
        activity?.AddTag("deployment.last.service_path", last.ServicePath);
        activity?.AddTag("deployment.last.compose_path", last.ComposePath);


        activity?.AddEvent(new ActivityEvent("Getting current system status and updating files"));
        
        var targetComposeUpdatedTask = UpdateComposeFile(credentials, deployment.Compose!.Current, ct);
        var targetSystemdUpdatedTask = target.UseService 
          ? UpdateSystemdFile(credentials, deployment.Compose!.Current, ct) // TODO if service path equal, but compose paths changed, we first need to stop the old service
          : Task.FromResult(false);
        var lastComposeStatusTask = last.ComposePath != target.ComposePath
          ? GetComposeIsRunning(credentials, deployment.Compose!.Current, ct)
          : Task.FromResult(false);
        var targetServiceStatusTask = target.UseService
          ? proxyClient.SystemdGetService(credentials, target.ServiceId, ct)
          : Task.FromResult<ProxyClient.SystemdGetServiceResponse?>(null)!;
        var lastServiceStatusTask = last.UseService
          ? proxyClient.SystemdGetService(credentials, last.ServiceId, ct)
          : Task.FromResult<ProxyClient.SystemdGetServiceResponse?>(null)!;

        await Task.WhenAll(targetComposeUpdatedTask, targetSystemdUpdatedTask, lastComposeStatusTask, targetServiceStatusTask, lastServiceStatusTask);

        activity?.AddEvent(new ActivityEvent("System status acquired, updating resource enablement state"));
        connectionLog.Info($"System status acquired, updating resource enablement state");

        if (await targetSystemdUpdatedTask)
        {
          await proxyClient.SystemdReload(credentials, ct);
        }

        using (var disableEnableActivity = Extensions.SuperComposeActivitySource.StartActivity("Disable old services and enable new"))
        {
          var pendingTasks = new List<Task>();
          
          var shouldDisableOldService =
            (last.UseService && !target.UseService) || (target.UseService && last.UseService && target.ServicePath != last.ServicePath);
          if (shouldDisableOldService)
          {
            disableEnableActivity?.AddEvent(new ActivityEvent("shouldDisableOldService"));
            
            var serviceStatus = await lastServiceStatusTask;

            if (serviceStatus != null && serviceStatus.IsEnabled)
            {
              pendingTasks.Add(proxyClient.SystemdDisableService(credentials, last.ServiceId, ct));
            }
          }

          var shouldEnableNewService =
            (target.UseService && !last.UseService) || (target.UseService && last.UseService && target.ServicePath != last.ServicePath);
          if (shouldEnableNewService)
          {
            disableEnableActivity?.AddEvent(new ActivityEvent("shouldEnableNewService"));
            
            var serviceStatus = await targetServiceStatusTask;

            if (serviceStatus != null && serviceStatus.IsEnabled)
            {
              pendingTasks.Add(proxyClient.SystemdEnableService(credentials, target.ServiceId, ct));
            }
          }

          await Task.WhenAll(pendingTasks.ToArray());
        }

        activity?.AddEvent(new ActivityEvent("Successfully changed resource enabled status, restarting resources"));
        connectionLog.Info($"Successfully changed resource enabled status, restarting resources");

        using (var startStopActivity = Extensions.SuperComposeActivitySource.StartActivity("Stop old and start new"))
        {
          var serviceChanged = target.UseService && last.UseService && target.ServicePath == last.ServicePath;
          if (serviceChanged)
          {
            startStopActivity?.AddEvent(new ActivityEvent("serviceChanged"));
            await proxyClient.SystemdRestartService(credentials, target.ServiceId, ct);
          }

          var servicePathChanged = target.UseService && last.UseService && target.ServicePath != last.ServicePath;
          if (servicePathChanged)
          {
            startStopActivity?.AddEvent(new ActivityEvent("bothUseServiceButServicePathHasChanged"));
            await proxyClient.SystemdStopService(credentials, last.ServiceId, ct);
            await proxyClient.SystemdStartService(credentials, target.ServiceId, ct);
          }

          var oldServiceNewCompose = last.UseService && !target.UseService;
          if (oldServiceNewCompose)
          {
            startStopActivity?.AddEvent(new ActivityEvent("oldServiceNewCompose"));
            await proxyClient.SystemdStopService(credentials, last.ServiceId, ct);
            await StartDockerCompose(credentials, deployment.Compose.Current, ct);
          }

          var oldComposeNewService = !last.UseService && target.UseService;
          if (oldComposeNewService)
          {
            startStopActivity?.AddEvent(new ActivityEvent("oldComposeNewService"));
            await StopDockerCompose(credentials, deployment.Compose.Current, ct);
            await proxyClient.SystemdStartService(credentials, last.ServiceId, ct);
          }

          var composeChanged = !last.UseService && !target.UseService && last.ComposePath == target.ComposePath;
          if (composeChanged)
          {
            startStopActivity?.AddEvent(new ActivityEvent("composeChanged"));
            await RestartDockerCompose(credentials, deployment.Compose.Current, ct);
          }

          var composePathChanged = !last.UseService && !target.UseService && last.ComposePath != target.ComposePath;
          if (composePathChanged)
          {
            startStopActivity?.AddEvent(new ActivityEvent("composePathChanged"));

            if (await lastComposeStatusTask && deployment.LastDeployedComposeVersion != null)
            {
              startStopActivity?.AddEvent(new ActivityEvent("Last compose running, stopping"));
              await StopDockerCompose(credentials, deployment.LastDeployedComposeVersion, ct);              
            }
            else
            {
              startStopActivity?.AddEvent(new ActivityEvent("Last compose not running"));
            }
            
            await StartDockerCompose(credentials, deployment.Compose.Current, ct);
          }
        }

        connectionLog.Info($"Restart successful, removing outdated resources");

        using (var removeActivity = Extensions.SuperComposeActivitySource.StartActivity("Remove old configurations"))
        {
          var pendingTasks = new List<Task>();

          var shouldRemoveOldService =
            (last.UseService && !target.UseService) || (target.UseService && last.UseService && target.ServicePath != last.ServicePath);
          if (shouldRemoveOldService)
          {
            removeActivity?.AddEvent(new ActivityEvent("shouldRemoveOldService"));
            pendingTasks.Add(RemoveService(credentials, last, ct));
          }

          var shouldRemoveOldCompose = target.ComposePath != last.ComposePath;
          if (shouldRemoveOldCompose)
          {
            removeActivity?.AddEvent(new ActivityEvent("shouldRemoveOldCompose"));
            pendingTasks.Add(RemoveCompose(credentials, last, ct));
          }
          
          await Task.WhenAll(pendingTasks.ToArray());
        }

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

    private async Task RemoveService(ConnectionParams credentials, DeploymentInfo deployment, CancellationToken ct = default)
    {
      if (!string.IsNullOrEmpty(deployment.ServicePath))
      {
        var removed = await proxyClient.DeleteFile(credentials, deployment.ServicePath, ct);

        if (removed)
        {
          connectionLog.Info($"Removed old service file");
        }
      }
    }

    private async Task RemoveCompose(ConnectionParams credentials, DeploymentInfo deployment, CancellationToken ct = default)
    {
      if (!string.IsNullOrEmpty(deployment.ComposePath))
      {
        var removed = await proxyClient.DeleteFile(credentials, deployment.ComposePath, ct);

        if (removed)
        {
          connectionLog.Info($"Removed old compose file");
        }
      }
    }

    private async Task<bool> GetComposeIsRunning(ConnectionParams credentials, ComposeVersion compose, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("GetComposeNeedsToStop");
      activity?.AddTag("supercompose.path", compose.ComposePath);

      var composePath = await GetDockerComposePath(credentials, ct);
      var res = await proxyClient.RunCommand(credentials, $"{composePath} --file '{compose.ComposePath}' ps --quiet", ct);

      return res.Code == 0 && res.Stdout != null && !string.IsNullOrEmpty(Encoding.UTF8.GetString(res.Stdout).Trim());
    }

    private record DeploymentInfo(bool DeploymentEnabled, bool UseService, string? ComposePath, string? ServicePath, string? ServiceId);

    private (DeploymentInfo target, DeploymentInfo lastApplied) CalculateDeploymentDiff(Deployment deployment)
    {
      var target = deployment.Compose!.Current;
      var last = deployment.LastDeployedComposeVersion;

      var targetService = target?.ServiceEnabled ?? false;
      var lastSvc = last?.ServiceEnabled ?? false;
      
      var targetEnabled = deployment!.Enabled && deployment.Node!.Enabled;
      var lastEnabled = deployment?.LastDeployedAsEnabled ?? false;

      return (
        new DeploymentInfo(targetEnabled, targetService, target?.ComposePath, targetService ? target?.ServicePath : null,
          targetService ? target?.ServiceName + ".service" : null),
        new DeploymentInfo(lastEnabled, lastSvc, last?.ComposePath, lastSvc ? last?.ServicePath : null, lastSvc ? last?.ServiceName + ".service" : null)
      );
    }

    private async Task<bool> UpdateComposeFile(ConnectionParams credentials, ComposeVersion composeVersion, CancellationToken ct)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("UpdateComposeFile");
      
      var resp = await proxyClient.UpsertFile(credentials, composeVersion.ComposePath, composeVersion.Content, true, ct);

      if (resp.Updated)
      {
        connectionLog.Info($"docker-compose.yaml has been updated");
      }

      return resp.Updated;
    }

    private async Task<bool> UpdateSystemdFile(ConnectionParams credentials, ComposeVersion compose, CancellationToken ct)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("UpdateSystemdFile");

      var serviceFile = await GenerateSystemdServiceFile(credentials, compose, ct);
      var resp = await proxyClient.UpsertFile(
        credentials,
        compose.ServicePath,
        Encoding.UTF8.GetBytes(serviceFile),
        false,
        ct
      );

      if (resp.Updated)
      {
        connectionLog.Info($"systemd service file has been updated");
      }

      return resp.Updated;
    }

    private record DockerComposeCredentials(ConnectionParams Credentials);

    private async Task<string> GetDockerComposePath(ConnectionParams credentials, CancellationToken ct = default)
    {
      return await cache.GetOrCreateAsync(new DockerComposeCredentials(credentials), async entry =>
      {
        using var activity = Extensions.SuperComposeActivitySource.StartActivity("GetDockerComposePath");
        
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
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("RestartDockerCompose");
      
      var composePath = await GetDockerComposePath(credentials, ct);
      await proxyClient.RunCommand(credentials, $"{composePath} --file '{compose.ComposePath}' restart", ct);
    }

    private async Task StopDockerCompose(ConnectionParams credentials,ComposeVersion compose, CancellationToken ct)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("StopDockerCompose");
      
      var composePath = await GetDockerComposePath(credentials, ct);
      await proxyClient.RunCommand(credentials, $"{composePath} --file '{compose.ComposePath}' down", ct);
    }

    private async Task StartDockerCompose(ConnectionParams credentials, ComposeVersion compose, CancellationToken ct)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("StartDockerCompose");
      
      var composePath = await GetDockerComposePath(credentials, ct);
      await proxyClient.RunCommand(credentials, $"{composePath} --file '{compose.ComposePath}'  up -d --remove-orphans", ct);
    }

    private async Task<string> GenerateSystemdServiceFile(ConnectionParams credentials, ComposeVersion composeVersion, CancellationToken ct)
    {
      var composePath = await GetDockerComposePath(credentials, ct);

      return $@"
[Unit]
Description={composeVersion} service with docker compose managed by supercompose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
Environment=""COMPOSE_PROJECT_NAME={composeVersion.ServiceName}""
Environment=""COMPOSE_FILE={composeVersion.Directory}/docker-compose.yml""
WorkingDirectory={composeVersion.Directory}
ExecStart={composePath} --project-directory ""{composeVersion.Directory}"" --project-name ""{composeVersion.ServiceName}"" up -d --remove-orphans
ExecStop={composePath} down

[Install]
WantedBy=multi-user.target".Trim().Replace("\r\n", "\n");
    }
  }
}