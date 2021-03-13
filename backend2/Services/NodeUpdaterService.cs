using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using backend2.HostedServices;
using backend2.Util;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using supercompose;

namespace backend2.Services
{
  public class NodeUpdaterService
  {
    public static readonly TimeSpan NodeCheckInterval = TimeSpan.FromHours(1);

    private readonly ILogger<NodeUpdaterService> logger;
    private readonly SupercomposeContext ctx;
    private readonly IConnectionMultiplexer multiplexer;
    private readonly ConnectionService connectionService;
    private readonly CryptoService cryptoService;
    private readonly ConnectionLogService connectionLog;

    public NodeUpdaterService(
      ILogger<NodeUpdaterService> logger,
      SupercomposeContext ctx,
      IConnectionMultiplexer multiplexer,
      ConnectionService connectionService,
      CryptoService cryptoService,
      ConnectionLogService connectionLog
    )
    {
      this.logger = logger;
      this.ctx = ctx;
      this.multiplexer = multiplexer;
      this.connectionService = connectionService;
      this.cryptoService = cryptoService;
      this.connectionLog = connectionLog;
    }

    public async Task NotifyAboutNodeChange(Guid nodeId)
    {
      await multiplexer.GetSubscriber().PublishAsync(NodeUpdateListener.ChannelName, nodeId.ToString());
    }

    public async Task ProcessNodeUpdates(Guid nodeId, CancellationToken ct)
    {
      while (!ct.IsCancellationRequested)
      {
        await using var trx = await ctx.Database.BeginTransactionAsync(ct);
        var node = await ctx.Nodes
          .Include(x => x.Deployments)
          .ThenInclude(x => x.Compose)
          .ThenInclude(x => x.Current)
          .Include(x => x.Deployments)
          .ThenInclude(x => x.LastDeployedVersion)
          .FirstOrDefaultAsync(x => x.Id == nodeId, ct);

        ct.ThrowIfCancellationRequested();

        if (node == null) break;
        if (node.PendingChange == null && node.Enabled == false) break;
        if (!DoesNodeHaveAnyPendingChanges(node)) break;

        using var _ = logger.BeginScope(new {nodeId});
        using var _2 = connectionLog.BeginScope(node.Id);

        logger.LogDebug("Pending changes detected, opening connection");

        var connectionParams = new ConnectionParams
        (
          node.Host,
          node.Username,
          node.Port!.Value,
          node.Password == null ? null : await cryptoService.DecryptSecret(node.Password),
          node.PrivateKey == null ? null : await cryptoService.DecryptSecret(node.PrivateKey)
        );

        try
        {
          await connectionLog.Info("Connecting");
          using var ssh = await connectionService.CreateSshConnection(connectionParams, TimeSpan.FromSeconds(10), ct);
        }
        catch (NodeConnectionFailedException ex)
        {
          logger.LogDebug("Node connection failed");
          await connectionLog.Error($"Node connection failed because {ex.Kind}", ex);
        }
      }
    }

    private static bool DoesNodeHaveAnyPendingChanges(Node node)
    {
      if (node.PendingChange != null) return true;
      if (node.Deployments.Any(x => x.PendingChange != null)) return true;
      if (node.Deployments.Any(x => x.Enabled == true && x.LastCheck == null)) return true;
      if (node.Deployments.Any(x =>
        x.Enabled == true && x.LastCheck != null && x.LastCheck + NodeCheckInterval < DateTime.UtcNow))
        return true;

      return false;
    }
  }
}