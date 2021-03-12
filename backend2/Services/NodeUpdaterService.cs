using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using backend2.HostedServices;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using supercompose;

namespace backend2.Services
{
  public class NodeUpdaterService
  {
    private readonly ILogger<NodeUpdaterService> logger;
    private readonly SupercomposeContext ctx;
    private readonly IConnectionMultiplexer multiplexer;

    public NodeUpdaterService(
      ILogger<NodeUpdaterService> logger,
      SupercomposeContext ctx,
      IConnectionMultiplexer multiplexer
    )
    {
      this.logger = logger;
      this.ctx = ctx;
      this.multiplexer = multiplexer;
    }

    public async Task NotifyAboutNodeChange(Guid nodeId)
    {
      await multiplexer.GetSubscriber().PublishAsync(NodeUpdateListener.ChannelName, nodeId.ToString());
    }

    public async Task ProcessNodeUpdates(Guid nodeId, CancellationToken ct)
    {
    }
  }
}