using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Net.NetworkInformation;
using System.Threading;
using System.Threading.Tasks;
using HotChocolate.Subscriptions;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Nito.AsyncEx;
using SuperCompose.Context;

namespace SuperCompose.HostedServices
{
  public class SaveConnectionLog : INotification
  {
    public ConnectionLog Log { get; set; }
  }

  public class ConnectionLogProcessor : BackgroundService, INotificationHandler<SaveConnectionLog>
  {
    private readonly IServiceProvider provider;
    private static ImmutableQueue<SaveConnectionLog> _queue = ImmutableQueue<SaveConnectionLog>.Empty;
    private static readonly AsyncManualResetEvent Reset = new(false);

    public ConnectionLogProcessor(IServiceProvider provider)
    {
      this.provider = provider;
    }

    public Task Handle(SaveConnectionLog notification, CancellationToken cancellationToken)
    {
      ImmutableInterlocked.Enqueue(ref _queue, notification);
      Reset.Set();
      return Task.CompletedTask;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
      while (!ct.IsCancellationRequested)
      {
        if (!Reset.IsSet) await Reset.WaitAsync(ct);
        if (ct.IsCancellationRequested) break;
        Reset.Reset();

        var current = Interlocked.Exchange(ref _queue, ImmutableQueue<SaveConnectionLog>.Empty);

        using var scope = provider.CreateScope();
        await using var ctx = scope.ServiceProvider.GetRequiredService<SuperComposeContext>();
        var eventSender = scope.ServiceProvider.GetRequiredService<ITopicEventSender>();

        await ctx.ConnectionLogs.BulkInsertAsync(current.Select(x => x.Log), ct);
        foreach (var log in current) await eventSender.SendAsync("connectionLogCreated", log.Log, ct);
      }
    }
  }
}