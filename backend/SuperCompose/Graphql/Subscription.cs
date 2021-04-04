using SuperCompose.Context;
using HotChocolate.Subscriptions;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using SuperCompose.Services;

namespace SuperCompose.Graphql
{
  public class Subscription
  {
    private readonly SuperComposeContext ctx;
    private readonly PubSubService pubSub;

    public Subscription(SuperComposeContext ctx, PubSubService pubSub)
    {
      this.ctx = ctx;
      this.pubSub = pubSub;
    }

    [SubscribeAndResolve]
    public async IAsyncEnumerable<ConnectionLog> OnConnectionLog(
      Guid? deploymentId,
      Guid? nodeId,
      Guid? composeId,
      DateTime? after,
      [EnumeratorCancellation] CancellationToken ct = default
    )
    {
      IQueryable<ConnectionLog> query = ctx.ConnectionLogs.OrderBy(x => x.Time);

      if (deploymentId != null) query = query.Where(x => x.DeploymentId == deploymentId);
      if (nodeId != null) query = query.Where(x => x.NodeId == nodeId);
      if (composeId != null) query = query.Where(x => x.ComposeId == composeId);

      query = query.Where(x => x.Time > (after ?? DateTime.UtcNow));

      foreach (var log in await query.ToListAsync(ct)) yield return log;

      var sub = await pubSub.OnConnectionLogCreated(ct);

      await foreach (var log in sub.ReadEventsAsync().WithCancellation(ct))
      {
        if (deploymentId != null && log.DeploymentId != deploymentId) continue;
        if (nodeId != null && log.NodeId != nodeId) continue;
        if (composeId != null && log.ComposeId != composeId) continue;
        if (after != null && log.Time < after) continue;

        yield return log;
      }
    }

    [SubscribeAndResolve]
    public async IAsyncEnumerable<ContainerChange> OnContainersChanged(
      Guid deploymentId,
      [EnumeratorCancellation] CancellationToken ct = default
    )
    {
      var sub = await pubSub.OnContainerChanged(ct);
      await foreach (var change in sub.ReadEventsAsync().WithCancellation(ct))
        if (change.DeploymentId == deploymentId)
          yield return change;
    }
  }
}