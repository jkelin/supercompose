using System;
using System.Collections;
using System.Collections.Generic;
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
    private readonly SuperComposeContext ctx;
    private readonly ConnectionService connService;
    private readonly CryptoService cryptoService;
    private readonly ILogger<NodeAgentService> logger;
    private readonly PubSubService pubSub;
    private readonly ConnectionLogService connectionLog;

    public NodeAgentService(SuperComposeContext ctx, ConnectionService connService, CryptoService cryptoService,
      ILogger<NodeAgentService> logger, PubSubService pubSub, ConnectionLogService connectionLog)
    {
      this.ctx = ctx;
      this.connService = connService;
      this.cryptoService = cryptoService;
      this.logger = logger;
      this.pubSub = pubSub;
      this.connectionLog = connectionLog;
    }

    public async Task RunNodeAgent(Guid nodeId, CancellationToken ct = default)
    {
      var tenantId = await ctx.Nodes
        .Where(x => x.Id == nodeId).Select(x => x.TenantId).FirstOrDefaultAsync(ct);
      
      using var _ = connectionLog.BeginScope(tenantId, nodeId: nodeId);
      using var _2 = logger.BeginScope(new {nodeId});

      try
      {
        var node = await ctx.Nodes
          .FirstOrDefaultAsync(x => x.Id == nodeId, ct);

        var client = await OpenSsh(node, ct);

        await ReloadContainersFor(ctx.Deployments.Where(x => x.NodeId == nodeId && x.Enabled == true), client, ct);
        var events = ListenForEvents(client, ct);

        await foreach (var ee in events.WithCancellation(ct))
        {
          logger.LogDebug("Received node event {type} {compose}", ee.msg.Type, ee
          .compose);
          var query = ctx.Deployments.Where(x =>
            x.NodeId == nodeId && x.LastDeployedComposeVersion.ServiceName == ee.compose);
          await ReloadContainersFor(query, client, ct);
        }
      }
      catch (TaskCanceledException)
      {
      }
      catch (NodeConnectionFailedException ex)
      {
        logger.LogInformation("Node agent connection failed failed {why}", ex.Message);
        connectionLog.Error($"Node connection failed", ex);
      }
      catch (ContainerInfoException ex)
      {
        logger.LogInformation("Failed to get container info {why}", ex.Message);
        connectionLog.Error($"Failed to get container info", ex);
      }
      catch (SshException ex)
      {
        logger.LogInformation("Node agent had an SSHException {why}", ex.Message);
        connectionLog.Error($"SSH error", ex);
      }
      catch (Exception ex)
      {
        logger.LogWarning(ex, "Unknown error in node agent {nodeId}", nodeId);
        connectionLog.Error($"Unknown error", ex);

        throw;
      }
    }

    private async Task<SshClient> OpenSsh(Node node, CancellationToken ct)
    {
      logger.LogDebug("Pending changes detected, opening ssh connection");

      var connectionParams = new ConnectionParams
      (
        node.Host,
        node.Username,
        node.Port,
        node.Password == null ? null : await cryptoService.DecryptSecret(node.Password),
        node.PrivateKey == null ? null : await cryptoService.DecryptSecret(node.PrivateKey)
      );

      connectionLog.Info($"Connecting SSH to {node.Username}@{node.Host}:{node.Port}");
      var ssh = await connService.CreateSshConnection(connectionParams, TimeSpan.FromSeconds(10), ct);

      ct.ThrowIfCancellationRequested();

      return ssh;
    }

    private async IAsyncEnumerable<(DateTime time, string compose, string service, Message msg)> ListenForEvents(
      SshClient ssh,
      [EnumeratorCancellation] CancellationToken ct = default)
    {
      var args = new[]
      {
        "--filter='label=com.docker.compose.project'",
        "--filter='type=container'",
        "--format='{{json .}}'"
        //"--since 10h"
      };
      var stream = connService.StreamLines(ssh, "docker events " + string.Join(" ", args), ct);
      logger.LogDebug("Listening for events");

      await foreach (var (result, error, status) in stream.WithCancellation(ct))
      {
        logger.LogTrace("Event received {Result}", result);
        
        if (status != null)
        {
          throw new Exception("Stream has ended"); // TODO;
        }
        else if (error != null)
        {
          throw new Exception("Stream has had an error"); // TODO;
        }
        else if (result != null)
        {
          var msg = JsonConvert.DeserializeObject<Message>(result);


          var a = msg.Action;
          var isCriticalAction =
            a == "create" || a == "destroy" || a == "die" || a == "kill" ||
            a == "oom" ||
            a == "pause" ||
            a == "rename" || a == "resize" || a == "restart" || a == "start" ||
            a == "stop" ||
            a == "unpause" ||
            a == "update";
          if (isCriticalAction &&
              msg.Actor.Attributes.TryGetValue("com.docker.compose.project",
                out var project) &&
              msg.Actor.Attributes.TryGetValue("com.docker.compose.service",
                out var service))
            yield return (
              DateTime.UnixEpoch +
              TimeSpan.FromMilliseconds(msg.TimeNano / 1000000), project,
              service,
              msg);
        }
      }
    }

    private async Task ReloadContainersFor(IQueryable<Deployment> query, SshClient ssh, CancellationToken ct = default)
    {
      var deployments = await query.Include(x => x.LastDeployedComposeVersion)
        .Include(x => x.Compose)
        .Include(x => x.Containers)
        .ToArrayAsync(ct);

      logger.LogDebug("Reloading containers for {deployments}", string.Join(",", deployments.Select(x => x.Id)));

      var list = await ListContainers(ssh, ct);
      await using var trx = await ctx.Database.BeginTransactionAsync(ct);

      var relevantContainers = FilterContainersForDeployments(list, deployments);
      var changes = new Queue<ContainerChange>();

      if (relevantContainers.Any())
      {
        var inspected = await InspectContainers(ssh, relevantContainers, ct);

        foreach (var deployment in deployments)
        {
          var relevantInspects = inspected
            .Where(x =>
              x.Config.Labels.ContainsKey("com.docker.compose.project") &&
              x.Config.Labels["com.docker.compose.project"] == deployment.LastDeployedComposeVersion.ServiceName
            );

          var deploymentChanges = await UpdateContainersForDeployment(relevantInspects, deployment, ct);
          foreach (var change in deploymentChanges) changes.Enqueue(change);
        }
      }
      else
      {
        foreach (var deployment in deployments)
        foreach (var container in deployment.Containers)
        {
          ctx.Containers.Remove(container);
          changes.Enqueue(new ContainerChange(ContainerChangeKind.Removed, container.Id, container.DeploymentId));
        }
      }

      await ctx.SaveChangesAsync(ct);
      await trx.CommitAsync(ct);
      foreach (var change in changes) await pubSub.ContainerChanged(change, ct);
    }

    private async Task<IReadOnlyCollection<ContainerChange>> UpdateContainersForDeployment(
      IEnumerable<ContainerInspectResponse> deploymentInspects,
      Deployment deployment, CancellationToken ct)
    {
      logger.LogTrace("Updating containers for deployment {Deployment}", deployment.Id);
      
      var processedContainers = new HashSet<Container>();
      var changes = new Queue<ContainerChange>();

      foreach (var inspect in deploymentInspects)
      {
        var labels = inspect.Config.Labels;
        var serviceName = labels["com.docker.compose.service"];
        if (!string.IsNullOrEmpty(serviceName) &&
            int.TryParse(labels["com.docker.compose.container-number"], out var containerNumber))
        {
          var container =
            deployment.Containers.FirstOrDefault(
              x => x.ServiceName == serviceName && x.ContainerNumber == containerNumber);

          if (container == null)
          {
            container = new Container
            {
              Id = Guid.NewGuid(),
              TenantId = deployment.TenantId,
              DeploymentId = deployment.Id
            };

            await ctx.Containers.AddAsync(container, ct);
            changes.Enqueue(new ContainerChange(ContainerChangeKind.Created, container.Id, container.DeploymentId));
          }
          else
          {
            changes.Enqueue(new ContainerChange(ContainerChangeKind.Changed, container.Id, container.DeploymentId));
          }

          container.ContainerNumber = containerNumber;
          container.ServiceName = serviceName;
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

          processedContainers.Add(container);
        }
      }

      var outdatedContainers = deployment.Containers.Except(processedContainers);
      foreach (var container in outdatedContainers)
      {
        changes.Enqueue(new ContainerChange(ContainerChangeKind.Removed, container.Id, container.DeploymentId));
        ctx.Containers.Remove(container);
      }

      return changes;
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

    private IReadOnlyCollection<ContainerListResult> FilterContainersForDeployments(
      IEnumerable<ContainerListResult> listResult,
      IEnumerable<Deployment> deployments)
    {
      var matcher = new Regex(@"(?<name>[^=,]+)(=(?<value>[^=,]+))?");
      var projects = deployments.Select(x => x.LastDeployedComposeVersion.ServiceName);

      var matched = listResult
        .Select(x =>
        {
          var matches = matcher.Matches(x.Labels);
          return x with
          {
            LabelsParsed = matches.ToDictionary(y => y.Groups["name"].Value, y => y.Groups["value"].Value)
          };
        });

      return matched
        .Where(x => projects.Contains(x.LabelsParsed["com.docker.compose.project"]))
        .ToArray();
    }

    private async Task<IReadOnlyCollection<ContainerInspectResponse>> InspectContainers(SshClient ssh,
      IEnumerable<ContainerListResult> containers,
      CancellationToken ct = default)
    {
      var command =
        $"docker inspect --format '{{{{json .}}}}' {string.Join(" ", containers.Select(x => $"'{x.Names}'"))}";
      var (stdout, stderr, code) = await connService.RunCommand(ssh, command, TimeSpan.FromSeconds(10), ct);

      if (code != 0 && !stderr.Contains("Error: No such object:"))
        throw new ContainerInfoException("Could not inspect containers")
        {
          StdErr = stderr,
          Command = command
        };

      return stdout
        .Split("\n")
        .Where(x => !string.IsNullOrEmpty(x))
        .Select(x => JsonConvert.DeserializeObject<ContainerInspectResponse>(x)!)
        .ToArray();
    }

    private async Task<IReadOnlyCollection<ContainerListResult>> ListContainers(SshClient ssh,
      CancellationToken ct = default)
    {
      const string? command =
        "docker container ls --all --format='{{json .}}' --filter='label=com.docker.compose.project'";
      var (stdout, stderr, code) = await connService.RunCommand(ssh, command, TimeSpan.FromSeconds(10), ct);

      if (code != 0)
        throw new ContainerInfoException("Could not list containers")
        {
          StdErr = stderr,
          Command = command
        };

      return stdout
        .Split("\n")
        .Where(x => !string.IsNullOrEmpty(x))
        .Select(x => JsonConvert.DeserializeObject<ContainerListResult>(x)!)
        .ToArray();
    }

    private record ContainerListResult(string Id, string Labels, Dictionary<string, string>? LabelsParsed,
      string Names);
  }
}