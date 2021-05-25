using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RedLockNet;
using Sentry;
using StackExchange.Redis;
using System;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using OpenTelemetry.Trace;
using SuperCompose.Context;
using SuperCompose.Services;
using SuperCompose.Util;

namespace SuperCompose.HostedServices
{
  public class NodeUpdateListener : BackgroundService
  {
    public const string ChannelName = "node_updates";

    private readonly IDistributedLockFactory lockFactory;
    private readonly IConnectionMultiplexer multiplexer;
    private readonly ILogger<NodeUpdateListener> logger;
    private readonly IServiceProvider provider;

    public NodeUpdateListener(
      IDistributedLockFactory lockFactory,
      IConnectionMultiplexer multiplexer,
      ILogger<NodeUpdateListener> logger,
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
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("HandleNodeUpdate");

      try
      {
        activity?.AddEvent(new ActivityEvent("Acquiring lock"));
        using var redLock = await lockFactory.CreateLockAsync(
          nodeId.ToString(),
          TimeSpan.FromSeconds(10),
          TimeSpan.FromMilliseconds(500),
          TimeSpan.FromMilliseconds(100),
          ct
        );
        ct.ThrowIfCancellationRequested();

        if (!redLock.IsAcquired)
        {
          logger.LogDebug("Already being processed (lock not acquired)");
          activity?.AddEvent(new ActivityEvent("Already being processed"));
          return;
        }

        activity?.AddEvent(new ActivityEvent("Lock acquired"));

        using var scope = provider.CreateScope();
        var nodeService = scope.ServiceProvider.GetRequiredService<NodeUpdaterService>();

        logger.LogInformation("Processing node update");

        await nodeService.ProcessNodeUpdates(nodeId, ct);

        logger.LogInformation("Completed processing node update");
      }
      catch (TaskCanceledException)
      {
      }
      catch (Exception ex)
      {
        logger.LogWarning(ex, "Error while processing node update");
        SentrySdk.CaptureException(ex);
        activity.RecordException(ex);
      }
    }
  }
}