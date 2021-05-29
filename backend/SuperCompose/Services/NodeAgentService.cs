using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Nito.Disposables;
using OpenTelemetry.Trace;
using Renci.SshNet;
using Renci.SshNet.Common;
using SuperCompose.Context;
using SuperCompose.Exceptions;
using SuperCompose.Util;
using Z.EntityFramework.Plus;
using ContainerState = SuperCompose.Context.ContainerState;

namespace SuperCompose.Services
{
  public class NodeAgentService
  {
    private readonly IDbContextFactory<SuperComposeContext> ctxFactory;
    private readonly ConnectionService connService;
    private readonly CryptoService cryptoService;
    private readonly ILogger<NodeAgentService> logger;
    private readonly PubSubService pubSub;
    private readonly ConnectionLogService connectionLog;
    private readonly ProxyClient proxyClient;
    private readonly NodeService nodeService;

    public NodeAgentService(
      IDbContextFactory<SuperComposeContext> ctxFactory,
      ConnectionService connService,
      CryptoService cryptoService,
      ILogger<NodeAgentService> logger,
      PubSubService pubSub,
      ConnectionLogService connectionLog,
      ProxyClient proxyClient,
      NodeService nodeService
    )
    {
      this.ctxFactory = ctxFactory;
      this.connService = connService;
      this.cryptoService = cryptoService;
      this.logger = logger;
      this.pubSub = pubSub;
      this.connectionLog = connectionLog;
      this.proxyClient = proxyClient;
      this.nodeService = nodeService;
    }

    public async Task RunNodeAgent(Guid nodeId, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("RunNodeAgent");
      await using var ctx = ctxFactory.CreateDbContext();

      var node = await ctx.Nodes.FirstOrDefaultAsync(x => x.Id == nodeId, ct);

      activity?.AddTag(Extensions.ActivityNodeIdName, nodeId.ToString());
      activity?.AddBaggage(Extensions.ActivityNodeIdName, nodeId.ToString());
      
      activity?.AddTag(Extensions.ActivityTenantIdName, node.TenantId.ToString());
      activity?.AddBaggage(Extensions.ActivityTenantIdName, node.TenantId.ToString());

      using var _ = logger.BeginScope(new {nodeId});

      try
      {
        var credentials = await cryptoService.GetNodeCredentials(node);

        await ReloadContainersForNode(credentials, nodeId, ct);
        
        var events = ListenForEvents(credentials, ct);
        await foreach (var ee in events.WithCancellation(ct))
        {
          logger.LogDebug("Received node event {type} {compose}", ee.Message.Type, ee.Compose);

          await HandleDockerEvent(credentials, ee, nodeId, ct);
        }
      }
      catch (TaskCanceledException)
      {
      }
      catch (ProxyClientException ex)
      {
        logger.LogInformation("Node agent connection failed {why}", ex.Message);
        connectionLog.Error($"Node connection failed", ex);
        activity.RecordException(ex);
      }
      catch (ContainerInfoException ex)
      {
        logger.LogInformation("Failed to get container info {why}", ex.Message);
        connectionLog.Error($"Failed to get container info", ex);
      }
      catch (Exception ex)
      {
        logger.LogWarning(ex, "Unknown error in node agent {nodeId}", nodeId);
        connectionLog.Error($"Unknown error", ex);

        throw;
      }
    }
    
     private async Task ReloadContainersForNode(NodeCredentials credentials, Guid nodeId, CancellationToken ct = default)
    {
      await using var ctx = ctxFactory.CreateDbContext();
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ReloadContainersForNode");
      activity?.SetTag(Extensions.ActivityNodeIdName, nodeId);
      activity?.AddBaggage(Extensions.ActivityNodeIdName, nodeId.ToString());

      var deployments = await ctx.Deployments
        .Where(x => x.NodeId == nodeId)
        .Include(x => x.Containers)
        .Select(x => new
        {
          Deployment = x,
          ServiceName = x.LastDeployedComposeVersion!.ServiceName ?? x.Compose!.Current.ServiceName
        })
        .ToArrayAsync(ct);
      
      var deploymentContainers = deployments.SelectMany(x => x.Deployment.Containers).ToArray();

      activity?.AddEvent(new ActivityEvent("deployments", tags: new ActivityTagsCollection
      {
        ["deployments"] = string.Join(Environment.NewLine, deployments.Select(x => x.Deployment.Id)),
        ["deploymentContainers"] = string.Join(Environment.NewLine, deploymentContainers.Select(x => x.Id)),
      }));

      var containerList = await proxyClient.ListContainers(credentials, ct);

      activity?.AddEvent(new ActivityEvent("containerList", tags: new ActivityTagsCollection
      {
        ["containerList"] = string.Join(Environment.NewLine, containerList.Select(x => x.ID)),
      }));
      
      var containersForRefresh = containerList
        .Where(x => !string.IsNullOrEmpty(x.Labels["com.docker.compose.project"]))
        .Select(x => new
        {
          Inspect = x,
          deployments.FirstOrDefault(y => y.ServiceName == x.Labels["com.docker.compose.project"])?.Deployment
        })
        .Where(x => x.Deployment != null)
        .ToArray();

      activity?.AddEvent(new ActivityEvent("containersForRefresh", tags: new ActivityTagsCollection
      {
        ["containersForRefresh"] = string.Join(Environment.NewLine, containersForRefresh.Select(x => x.Inspect.ID)),
      }));

      await Task.WhenAll(containersForRefresh.Select(x => InspectContainer(credentials, x.Deployment!, x.Inspect.ID, ct)));

      var outdatedContainers = deploymentContainers
        .Select(x => x.DockerId)
        .Except(containerList.Select(x => x.ID))
        .Join(deploymentContainers, x => x, x => x.DockerId, (id, container) => container)
        .ToArray();

      activity?.AddEvent(new ActivityEvent("outdatedContainers", tags: new ActivityTagsCollection
      {
        ["outdatedContainers"] = string.Join(Environment.NewLine, outdatedContainers.Select(x => x.Id)),
      }));

      await ctx.Containers.BulkDeleteAsync(outdatedContainers, ct);
      foreach (var container in outdatedContainers) {
        await pubSub.ContainerChanged(
          new ContainerChange(ContainerChangeKind.Removed, container.Id, container.DeploymentId),
          ct
        );
      }
    }

    private record DockerEvent(DateTime Time, string Compose, string Service, Message Message);
    private async IAsyncEnumerable<DockerEvent> ListenForEvents(
      NodeCredentials credentials,
      [EnumeratorCancellation] CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ListenForEvents");
      
      var stream = proxyClient.DockerEvents(credentials, ct);
      logger.LogDebug("Listening for events");

      await foreach (var msg in stream.WithCancellation(ct))
      {
        if (string.IsNullOrEmpty(msg.Action) || msg.Actor == null ||
            msg.Actor.Attributes == null)
        {
          logger.LogWarning("Deserialized message is invalid {@Message}", msg);
          throw new InvalidOperationException("Invalid message received from stream");
        }

        var isCriticalAction =
          msg.Action is "create" or "destroy" or "die" or "kill" or "oom" or "pause" or "rename" or "resize" or "restart" or "start" or "stop" or "unpause" or "update";
        if (isCriticalAction &&
            msg.Actor.Attributes.TryGetValue("com.docker.compose.project", out var project) &&
            msg.Actor.Attributes.TryGetValue("com.docker.compose.service", out var service))
        {
          yield return new DockerEvent(
            DateTime.UnixEpoch + TimeSpan.FromMilliseconds(msg.TimeNano / 1000000),
            project,
            service,
            msg
          );
        }
      }

      throw new Exception("Stream has ended"); // TODO;
    }
    
    
    private async Task HandleDockerEvent(NodeCredentials credentials, DockerEvent ee, Guid nodeId, CancellationToken ct = default)
    {
      await using var ctx = ctxFactory.CreateDbContext();
      
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("HandleDockerEvent");
      
      activity?.SetTag("event.type", ee.Message.Type);
      activity?.SetTag("event.actor", ee.Message.Actor.ID);
      activity?.SetTag("event.action", ee.Message.Action);
      activity?.SetTag("event.compose", ee.Compose);
      activity?.SetTag("event.service", ee.Service);
      activity?.SetTag("event.status", ee.Message.Status);

      try
      {
        var type = ee.Message.Type;
        var action = ee.Message.Action;
        var status = ee.Message.Status;
        var composeName = ee.Compose;
        var containerId = ee.Message.Actor.ID;

        var changes = new Queue<ContainerChange>();
        
        if(type != "container") return;

        var deployment = await ctx.Deployments
          .Where(x => x.NodeId == nodeId)
          .Where(x => x.LastDeployedComposeVersion != null
            ? x.LastDeployedComposeVersion.ServiceName == composeName
            : x.Compose!.Current.ServiceName == composeName)
          .Include(x => x.Containers.Where(y => y.DockerId == containerId))
          .FirstOrDefaultAsync(ct);

        if (deployment == null) return;

        var container = deployment.Containers.FirstOrDefault(x => x.DockerId == containerId);

        if (container == null && status is not "kill" and not "die" and not "stop" and not "destroy")
        {
          container = await InspectContainer(credentials, deployment, containerId, ct);
        }
        else if (status is "rename" or "scale" or "update")
        {
          container = await InspectContainer(credentials, deployment, containerId, ct);
        }

        if (container != null)
        {
          switch (status)
          {
            case "kill" or "die":
              container.State = ContainerState.Exited;
              container.FinishedAt = DateTime.UtcNow;
              changes.Enqueue(new ContainerChange(ContainerChangeKind.Changed, container.Id, container.DeploymentId));
              break;
            case "stop":
              container.State = ContainerState.Dead;
              changes.Enqueue(new ContainerChange(ContainerChangeKind.Changed, container.Id, container.DeploymentId));
              break;
            case "pause":
              container.State = ContainerState.Paused;
              changes.Enqueue(new ContainerChange(ContainerChangeKind.Changed, container.Id, container.DeploymentId));
              break;
            case "unpause":
              container.State = ContainerState.Running;
              changes.Enqueue(new ContainerChange(ContainerChangeKind.Changed, container.Id, container.DeploymentId));
              break;
            case "restart":
              container.State = ContainerState.Running;
              container.FinishedAt = DateTime.UtcNow;
              changes.Enqueue(new ContainerChange(ContainerChangeKind.Changed, container.Id, container.DeploymentId));
              break;
            case "start":
              container.State = ContainerState.Running;
              container.FinishedAt = DateTime.UtcNow;
              changes.Enqueue(new ContainerChange(ContainerChangeKind.Changed, container.Id, container.DeploymentId));
              break;
            case "create":
              container.State = ContainerState.Created;
              changes.Enqueue(new ContainerChange(ContainerChangeKind.Changed, container.Id, container.DeploymentId));
              break;
            case "destroy":
              ctx.Containers.Remove(container);
              changes.Enqueue(new ContainerChange(ContainerChangeKind.Removed, container.Id, container.DeploymentId));
              break;
            default:
              logger.LogWarning("Unknown event type {Type} {Action} {Status}", type, action, status);
              break;
          }
        }

        await ctx.SaveChangesAsync(ct);
        foreach (var change in changes) await pubSub.ContainerChanged(change, ct);
      }
      catch (Exception ex)
      {
        logger.LogWarning(ex, "Unknown error in node {NodeId} while handling event {Event}", nodeId, ee);

        activity.RecordException(ex);
        throw;
      }
    }

    private async Task<Container> InspectContainer(NodeCredentials credentials, Deployment deployment, string containerId, CancellationToken ct)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("InspectContainer");
      activity?.SetTag(Extensions.ActivityNodeIdName, deployment.NodeId);
      activity?.AddBaggage(Extensions.ActivityNodeIdName, deployment.NodeId.ToString());

      activity?.SetTag(Extensions.ActivityDeploymentIdName, deployment.Id);
      activity?.AddBaggage(Extensions.ActivityDeploymentIdName, deployment.Id.ToString());

      activity?.SetTag("containerId", containerId.ToString());

      var changes = new Queue<ContainerChange>();
      var inspect = await proxyClient.InspectContainer(credentials, containerId, ct);
      
      await using var strategyCtx = ctxFactory.CreateDbContext();
      var strategy = strategyCtx.Database.CreateExecutionStrategy();
      var outerContainer = await strategy.ExecuteAsync(async () =>
      {
        await using var ctx = ctxFactory.CreateDbContext();
        await using var trx = await ctx.Database.BeginTransactionAsync(ct);

        var labels = inspect.Config.Labels;
        if (labels == null || !int.TryParse(labels["com.docker.compose.container-number"], out var containerNumber))
        {
          throw new InvalidOperationException("Could not parse container-number label from container");
        }

        var container = await ctx.Containers.FirstOrDefaultAsync(x => x.DockerId == containerId, ct);
        if (container == null)
        {
          container = new Container
          {
            Id = Guid.NewGuid(),
            DeploymentId = deployment.Id,
            TenantId = deployment.TenantId,
            DockerId = inspect.ID,
          };

          ctx.Containers.Add(container);
          changes.Enqueue(new ContainerChange(ContainerChangeKind.Created, container.Id, container.DeploymentId));
        }
        else
        {
          changes.Enqueue(new ContainerChange(ContainerChangeKind.Changed, container.Id, container.DeploymentId));
        }

        container.ContainerNumber = containerNumber;
        container.ServiceName = labels["com.docker.compose.service"];
        container.State = DockerStateToContainerState(inspect.State.Status);
        container.ContainerName = inspect.Name[0] == '/' ? inspect.Name.Substring(1) : inspect.Name;
        container.LastInspectAt = DateTime.UtcNow;
        container.LastInspect = inspect;

        container.FinishedAt = DateTime.TryParse(inspect.State.FinishedAt, out var finishedAt) &&
                               finishedAt > DateTime.UnixEpoch
          ? finishedAt
          : null;

        container.StartedAt = DateTime.TryParse(inspect.State.StartedAt, out var startedAt) &&
                              startedAt > DateTime.UnixEpoch
          ? startedAt
          : null;

        await ctx.SaveChangesAsync(ct);
        await trx.CommitAsync(ct);

        return container;
      });
      
      foreach (var change in changes) await pubSub.ContainerChanged(change, ct);
      
      return outerContainer;
    }


    private static ContainerState DockerStateToContainerState(string state)
    {
      return state switch
      {
        "created" => ContainerState.Created,
        "running" => ContainerState.Running,
        "paused" => ContainerState.Paused,
        "restarting" => ContainerState.Restarting,
        "removing" => ContainerState.Removing,
        "exited" => ContainerState.Exited,
        "dead" => ContainerState.Dead,
        _ => throw new IndexOutOfRangeException(nameof(state))
      };
    }
  }
}