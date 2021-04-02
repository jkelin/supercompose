using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Nito.Disposables;
using Renci.SshNet;
using SuperCompose.Context;
using SuperCompose.Util;
using ContainerState = SuperCompose.Context.ContainerState;

namespace SuperCompose.Services
{
  public class NodeInfoService
  {
    private readonly SuperComposeContext ctx;
    private readonly ConnectionService connService;
    private readonly CryptoService cryptoService;

    public NodeInfoService(SuperComposeContext ctx, ConnectionService connService, CryptoService cryptoService)
    {
      this.ctx = ctx;
      this.connService = connService;
      this.cryptoService = cryptoService;
    }

    public async Task ListenOnNode(Guid nodeId, CancellationToken ct = default)
    {
      var node = await ctx.Nodes
        .FirstOrDefaultAsync(x => x.Id == nodeId, ct);

      var connectionParams = new ConnectionParams
      (
        node.Host,
        node.Username,
        node.Port,
        node.Password == null ? null : await cryptoService.DecryptSecret(node.Password),
        node.PrivateKey == null ? null : await cryptoService.DecryptSecret(node.PrivateKey)
      );
      var client = await connService.CreateSshConnection(connectionParams, TimeSpan.FromSeconds(10), ct);

      await ReloadContainersForNode(nodeId, client, ct);
    }

    private async Task ReloadContainersForNode(Guid nodeId, SshClient ssh, CancellationToken ct)
    {
      var deployments = await ctx.Deployments
        .Where(x => x.NodeId == nodeId && x.Enabled == true)
        .Include(x => x.LastDeployedComposeVersion)
        .Include(x => x.Compose)
        .Include(x => x.Containers)
        .ToArrayAsync(ct);

      var list = await ListContainers(ssh, ct);

      var relevantContainers = FilterContainersForDeployments(list, deployments);
      if (!relevantContainers.Any()) return;

      var inspected = await InspectContainers(ssh, relevantContainers, ct);
      await using var trx = await ctx.Database.BeginTransactionAsync(ct);

      foreach (var deployment in deployments)
      {
        var relevantInspects = inspected
          .Where(x =>
            x.Config.Labels.ContainsKey("com.docker.compose.project") &&
            x.Config.Labels["com.docker.compose.project"] == deployment.LastDeployedComposeVersion.ServiceName
          );

        await UpdateContainersForDeployment(relevantInspects, deployment, ct);
      }

      await ctx.SaveChangesAsync(ct);
      await trx.CommitAsync(ct);
    }

    private async Task UpdateContainersForDeployment(IEnumerable<ContainerInspectResponse> deploymentInspects,
      Deployment deployment, CancellationToken ct)
    {
      var processedContainers = new HashSet<Container>();

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
              DeploymentId = deployment.Id
            };

            await ctx.Containers.AddAsync(container, ct);
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
      foreach (var container in outdatedContainers) ctx.Containers.Remove(container);
    }

    private ContainerState DockerStateToContainerState(string state)
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

    private IEnumerable<string> FilterContainersForDeployments(IEnumerable<ContainerListResult> listResult,
      IEnumerable<Deployment> deployments)
    {
      var matcher = new Regex(@"(?<name>[^=,]+)(=(?<value>[^=,]+))?");
      var projects = deployments.Select(x => x.LastDeployedComposeVersion.ServiceName);

      var matched = listResult
        .Select(x =>
        {
          var matches = matcher.Matches(x.Labels);
          return new
          {
            x.Id,
            Labels = matches.ToDictionary(y => y.Groups["name"].Value, y => y.Groups["value"].Value)
          };
        });

      return matched
        .Where(x => projects.Contains(x.Labels["com.docker.compose.project"]))
        .Select(x => x.Id);
    }

    private async Task<IEnumerable<ContainerInspectResponse>> InspectContainers(SshClient ssh,
      IEnumerable<string> containers,
      CancellationToken ct = default)
    {
      var command = $"docker inspect --format '{{{{json .}}}}' {string.Join(" ", containers.Select(x => $"\"{x}\""))}";
      var result = await connService.RunCommand(ssh, command, TimeSpan.FromSeconds(10), ct);

      if (result.status != 0) throw new Exception("Could not inspect containers");

      return result.result
        .Split("\n")
        .Where(x => !string.IsNullOrEmpty(x))
        .Select(x => JsonConvert.DeserializeObject<ContainerInspectResponse>(x)!);
    }

    private async Task<IEnumerable<ContainerListResult>> ListContainers(SshClient ssh,
      CancellationToken ct = default)
    {
      var command = "docker container ls --format='{{json .}}' --filter='label=com.docker.compose.project'";
      var result = await connService.RunCommand(ssh, command, TimeSpan.FromSeconds(10), ct);

      if (result.status != 0) throw new Exception("Could not list containers");

      return result.result
        .Split("\n")
        .Where(x => !string.IsNullOrEmpty(x))
        .Select(x => JsonConvert.DeserializeObject<ContainerListResult>(x)!);
    }

    private class ContainerListResult
    {
      public string Id { get; set; }

      public string Labels { get; set; }
    }
  }
}