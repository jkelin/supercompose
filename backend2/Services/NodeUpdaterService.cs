using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using backend2.HostedServices;
using backend2.Util;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProtoBuf.WellKnownTypes;
using Renci.SshNet;
using StackExchange.Redis;
using supercompose;

namespace backend2.Services
{
  /// <summary>
  /// This is a core component that performs pending updates for individual nodes
  /// </summary>
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

        using var _ = logger.BeginScope(new {nodeId});
        using var _2 = connectionLog.BeginScope(node.Id);

        SshClient? ssh = null;
        SftpClient? sftp = null;

        // Open SSH connection only if it's actually needed
        async ValueTask<SshClient> ConnectSsh()
        {
          return ssh ??= await OpenSsh(node, ct);
        }

        async ValueTask<SftpClient> ConnectSftp()
        {
          return sftp ??= await OpenSftp(node, ct);
        }

        try
        {
          while (true)
          {
            if (node.ReconciliationFailed == true)
            {
              break;
            }
            else if (node.PendingChange == NodePendingChange.Enable && node.Enabled == false)
            {
              await EnableNode(node, await ConnectSsh(), ct);
              continue;
            }
            else if (node.PendingChange == NodePendingChange.Disable && node.Enabled == true)
            {
              await DisableNode(node, ct);
              continue;
            }
            else if (node.Enabled == false)
            {
              break;
            }
            else
            {
              foreach (var deployment in node.Deployments.Where(x => x.PendingChange != null))
              {
                //TODO
              }

              foreach (var deployment in node.Deployments.Where(x =>
                x.Enabled == true && x.LastCheck + NodeCheckInterval > DateTime.UtcNow))
              {
                // TODO
              }
            }

            break;
          }
        }
        catch (NodeConnectionFailedException ex)
        {
          logger.LogDebug("Node connection failed");
          connectionLog.Error($"Node connection failed because {ex.Kind}", ex);
        }
        finally
        {
          sftp?.Dispose();
          ssh?.Dispose();
        }
      }
    }

    private async Task<SshClient> OpenSsh(Node node, CancellationToken ct)
    {
      logger.LogDebug("Pending changes detected, opening ssh connection");

      var connectionParams = new ConnectionParams
      (
        node.Host,
        node.Username,
        node.Port!.Value,
        node.Password == null ? null : await cryptoService.DecryptSecret(node.Password),
        node.PrivateKey == null ? null : await cryptoService.DecryptSecret(node.PrivateKey)
      );

      connectionLog.Info($"Connecting SSH to {node.Username}@{node.Host}:{node.Port}");
      using var ssh = await connectionService.CreateSshConnection(connectionParams, TimeSpan.FromSeconds(10), ct);

      ct.ThrowIfCancellationRequested();

      return ssh;
    }

    private async Task<SftpClient> OpenSftp(Node node, CancellationToken ct)
    {
      logger.LogDebug("Pending changes detected, opening sftp connection");

      var connectionParams = new ConnectionParams
      (
        node.Host,
        node.Username,
        node.Port!.Value,
        node.Password == null ? null : await cryptoService.DecryptSecret(node.Password),
        node.PrivateKey == null ? null : await cryptoService.DecryptSecret(node.PrivateKey)
      );

      connectionLog.Info($"Connecting SFTP to {node.Username}@{node.Host}:{node.Port}");
      using var sftp = await connectionService.CreateSftpConnection(connectionParams, TimeSpan.FromSeconds(10), ct);

      ct.ThrowIfCancellationRequested();

      return sftp;
    }

    private async Task<(string result, string error, int status)> RunCommand(SshClient ssh, string command,
      CancellationToken ct)
    {
      connectionLog.Info($"Running command: {command}");

      var result = await connectionService.RunCommand(ssh, command, TimeSpan.FromSeconds(10), ct);

      if (result.status != 0) connectionLog.Info($"Command failed with status: {result.status}");

      return result;
    }

    private async Task EnableNode(Node node, SshClient ssh, CancellationToken ct)
    {
      connectionLog.Info("Enabling node");

      var systemctlVersion = await RunCommand(ssh, "systemctl --version", ct);
      if (systemctlVersion.status != 0)
      {
        logger.LogDebug("systemd unavailable");
        connectionLog.Error("systemd unavailable, stopping node configuration");
        node.ReconciliationFailed = true;
        await ctx.SaveChangesAsync();
        return;
      }

      var dockerVersion = await RunCommand(ssh, "docker --version", ct);
      if (dockerVersion.status != 0)
      {
        logger.LogDebug("docker unavailable");
        connectionLog.Error("docker unavailable, stopping node configuration");
        node.ReconciliationFailed = true;
        await ctx.SaveChangesAsync();
        return;
      }

      var dockerComposeVersion = await RunCommand(ssh, "docker-compose --version", ct);
      if (dockerVersion.status != 0)
      {
        logger.LogDebug("docker-compose unavailable");
        connectionLog.Error("docker-compose unavailable, stopping node configuration");
        node.ReconciliationFailed = true;
        await ctx.SaveChangesAsync();
        return;
      }

      // TODO determine what to do if there is a race condition and node PendingChange gets updated in the meantime
      node.PendingChange = null;
      node.Enabled = true;

      foreach (var deployment in node.Deployments) deployment.LastCheck = null;

      await ctx.SaveChangesAsync();
    }

    private async Task DisableNode(Node node, CancellationToken ct)
    {
      connectionLog.Info("Disabling node");

      node.PendingChange = null;
      node.Enabled = false;

      foreach (var deployment in node.Deployments) deployment.LastCheck = null;

      await ctx.SaveChangesAsync();
    }
  }
}