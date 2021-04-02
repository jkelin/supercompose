using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RedLockNet;
using Sentry;
using StackExchange.Redis;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SuperCompose.Context;
using SuperCompose.Services;

namespace SuperCompose.HostedServices
{
  public class NodeInfoListener : BackgroundService
  {
    public const string ChannelName = "node_info";

    private readonly IDistributedLockFactory lockFactory;
    private readonly IConnectionMultiplexer multiplexer;
    private readonly ILogger<NodeInfoListener> logger;
    private readonly IServiceProvider provider;

    public NodeInfoListener(
      IDistributedLockFactory lockFactory,
      IConnectionMultiplexer multiplexer,
      ILogger<NodeInfoListener> logger,
      IServiceProvider provider
    )
    {
      this.lockFactory = lockFactory;
      this.multiplexer = multiplexer;
      this.logger = logger;
      this.provider = provider;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
      await TriggerUpdateForAllNodes(ct);

      var chan = await multiplexer.GetSubscriber().SubscribeAsync(ChannelName);

      try
      {
        while (!ct.IsCancellationRequested)
        {
          var message = await chan.ReadAsync(ct);
          ct.ThrowIfCancellationRequested();

          if (Guid.TryParse(message.Message.ToString(), out var id))
          {
            var _ = HandleNodeUpdate(id, ct).ConfigureAwait(false);
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

    private async Task TriggerUpdateForAllNodes(CancellationToken ct)
    {
      using var scope = provider.CreateScope();
      var ctx = scope.ServiceProvider.GetRequiredService<SuperComposeContext>();

      await foreach (var node in ctx.Nodes.Where(x => x.Enabled == true).AsAsyncEnumerable().WithCancellation(ct))
      {
        var _ = HandleNodeUpdate(node.Id, ct).ConfigureAwait(false);
      }
    }

    private async Task HandleNodeUpdate(Guid nodeId, CancellationToken ct)
    {
      using var _ = logger.BeginScope(new {nodeId});

      try
      {
        using var redLock = await lockFactory.CreateLockAsync(
          nodeId.ToString() + "_listener",
          TimeSpan.FromSeconds(10),
          TimeSpan.FromMilliseconds(500),
          TimeSpan.FromMilliseconds(100),
          ct
        );
        ct.ThrowIfCancellationRequested();

        if (!redLock.IsAcquired)
        {
          logger.LogDebug("Already being processed (lock not acquired)");
          return;
        }

        using var scope = provider.CreateScope();
        var infoListener = scope.ServiceProvider.GetRequiredService<NodeInfoService>();

        logger.LogInformation("Listening on node");

        await infoListener.ListenOnNode(nodeId, ct);

        logger.LogInformation("Completed listening on node");
      }
      catch (TaskCanceledException)
      {
      }
      catch (Exception ex)
      {
        logger.LogWarning(ex, "Error while listening on node");
        SentrySdk.CaptureException(ex);
      }
    }
  }
}