using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using backend2.Context;
using HotChocolate.Subscriptions;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using supercompose;

namespace backend
{
  public class Subscription
  {
    private readonly SupercomposeContext ctx;
    private readonly ITopicEventReceiver eventReceiver;

    public Subscription(SupercomposeContext ctx, ITopicEventReceiver eventReceiver)
    {
      this.ctx = ctx;
      this.eventReceiver = eventReceiver;
    }

    [SubscribeAndResolve]
    public async IAsyncEnumerable<ConnectionLog> OnConnectionLog(
      Guid? deploymentId,
      Guid? nodeId,
      Guid? composeId,
      DateTime? after,
      CancellationToken ct = default
    )
    {
      IQueryable<ConnectionLog> query = ctx.ConnectionLogs.OrderBy(x => x.Time);

      if (deploymentId != null) query = query.Where(x => x.DeploymentId == deploymentId);
      if (nodeId != null) query = query.Where(x => x.NodeId == nodeId);
      if (composeId != null) query = query.Where(x => x.ComposeId == composeId);

      query = query.Where(x => x.Time > (after ?? DateTime.UtcNow));

      foreach (var log in await query.ToListAsync(ct)) yield return log;

      var sub = await eventReceiver.SubscribeAsync<string, ConnectionLog>($"connectionLogCreated", ct);

      await foreach (var log in sub.ReadEventsAsync().WithCancellation(ct))
      {
        if (deploymentId != null && log.DeploymentId != deploymentId) continue;
        if (nodeId != null && log.NodeId != nodeId) continue;
        if (composeId != null && log.ComposeId != composeId) continue;
        if (after != null && log.Time < after) continue;

        yield return log;
      }
    }
  }
}