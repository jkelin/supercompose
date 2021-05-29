using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RedLockNet;
using Sentry;
using StackExchange.Redis;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SuperCompose.Context;
using SuperCompose.Services;
using SuperCompose.Util;

namespace SuperCompose.HostedServices
{
  public class NodeAgentOrchestrator : BackgroundService
  {
    public const string ChannelName = "node_changed";

    private readonly IConnectionMultiplexer multiplexer;
    private readonly ILogger<NodeAgentOrchestrator> logger;
    private readonly IServiceProvider provider;

    private readonly ConcurrentDictionary<Guid, CancellationTokenSource> agents = new();

    public NodeAgentOrchestrator(
      IConnectionMultiplexer multiplexer,
      ILogger<NodeAgentOrchestrator> logger,
      IServiceProvider provider
    )
    {
      this.multiplexer = multiplexer;
      this.logger = logger;
      this.provider = provider;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
      var chan = await multiplexer.GetSubscriber().SubscribeAsync(ChannelName);

      try
      {
        await StartAllAgents(ct);
        using var scope = provider.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<SuperComposeContext>();

        while (!ct.IsCancellationRequested)
        {
          var message = await chan.ReadAsync(ct);
          ct.ThrowIfCancellationRequested();

          if (Guid.TryParse(message.Message.ToString(), out var id))
          {
            var node = await ctx.Nodes.FirstOrDefaultAsync(x => x.Id == id, ct);

            if (node != null)
              RestartNodeAgent(id);
            else
              StopNodeAgent(id);
          }
          else
          {
            logger.LogWarning("Unknown message {message}", message.ToString());
          }
        }
      }
      finally
      {
        await chan.UnsubscribeAsync();
      }
    }

    private async Task StartAllAgents(CancellationToken ct)
    {
      using var scope = provider.CreateScope();
      var ctx = scope.ServiceProvider.GetRequiredService<SuperComposeContext>();

      await foreach (var node in ctx.Nodes.Where(x => x.Enabled == true).AsAsyncEnumerable().WithCancellation(ct))
        RestartNodeAgent(node.Id);
    }

    private void RestartNodeAgent(Guid nodeId)
    {
      agents.AddOrUpdate(nodeId, (id) =>
      {
        CancellationTokenSource cts = new();
        RunNodeAgent(id, cts.Token).ConfigureAwait(false);
        return cts;
      }, (id, oldCts) =>
      {
        oldCts.Cancel();

        CancellationTokenSource cts = new();
        RunNodeAgent(id, cts.Token).ConfigureAwait(false);
        return cts;
      });
    }

    private void StopNodeAgent(Guid nodeId)
    {
      if (agents.TryRemove(nodeId, out var oldCts)) oldCts.Cancel();
    }

    private async Task RunNodeAgent(Guid nodeId, CancellationToken ct)
    {
      TimeSpan delay = default;
      DateTime lastDelay = default;
      using var _ = logger.BeginScope(new {nodeId});

      while (!ct.IsCancellationRequested)
      {
        using var scope = provider.CreateScope();
        using var activity = Extensions.SuperComposeActivitySource.StartActivity("RunNodeAgent");

        try
        {
          var nodeService = scope.ServiceProvider.GetRequiredService<NodeAgentService>();

          logger.LogInformation("Starting node agent");

          await nodeService.RunNodeAgent(nodeId, ct);

          logger.LogInformation("Finished node agent");
        }
        catch (TaskCanceledException)
        {
          logger.LogInformation("Stopped node agent");
        }
        catch (Exception ex)
        {
          logger.LogWarning(ex, "Error in node agent");
          SentrySdk.CaptureException(ex);

          if (lastDelay + TimeSpan.FromSeconds(10) < DateTime.UtcNow) delay = TimeSpan.FromMilliseconds(500);

          logger.LogDebug(ex, "Sleeping node agent for {delay}", delay);
          await Task.Delay(delay, ct);
          delay *= 2;
          lastDelay = DateTime.Now;
        }
      }
    }

    public override void Dispose()
    {
      foreach (var cancellationTokenSource in agents) cancellationTokenSource.Value.Cancel();
      agents.Clear();
      base.Dispose();
    }
  }
}