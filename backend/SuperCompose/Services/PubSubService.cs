using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using HotChocolate.Execution;
using HotChocolate.Subscriptions;
using SuperCompose.Context;

namespace SuperCompose.Services
{
  public enum ContainerChangeKind
  {
    Created,
    Removed,
    Changed
  }

  public record ContainerChange(ContainerChangeKind Kind, Guid ContainerId, Guid DeploymentId);

  public class PubSubService
  {
    private readonly ITopicEventReceiver eventReceiver;
    private readonly ITopicEventSender eventSender;

    public PubSubService(ITopicEventReceiver eventReceiver, ITopicEventSender eventSender)
    {
      this.eventReceiver = eventReceiver;
      this.eventSender = eventSender;
    }

    public async ValueTask ConnectionLogCreated(ConnectionLog log, CancellationToken ct = default)
    {
      await eventSender.SendAsync(nameof(ConnectionLogCreated), log, ct);
    }

    public async ValueTask<ISourceStream<ConnectionLog>> OnConnectionLogCreated(CancellationToken ct = default)
    {
      return await eventReceiver.SubscribeAsync<string, ConnectionLog>(nameof(ConnectionLogCreated), ct);
    }

    public async ValueTask ContainerChanged(ContainerChange item, CancellationToken ct = default)
    {
      await eventSender.SendAsync(nameof(ContainerChanged), item, ct);
    }

    public async ValueTask<ISourceStream<ContainerChange>> OnContainerChanged(CancellationToken ct = default)
    {
      return await eventReceiver.SubscribeAsync<string, ContainerChange>(nameof(ContainerChanged), ct);
    }
  }
}