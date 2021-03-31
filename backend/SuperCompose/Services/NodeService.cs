using System;
using System.Linq;
using System.Runtime.Serialization;
using System.Threading;
using System.Threading.Tasks;
using SuperCompose.Util;
using Microsoft.EntityFrameworkCore;
using SuperCompose.Context;
using SuperCompose.Exceptions;
using Z.EntityFramework.Plus;

namespace SuperCompose.Services
{
  public class NodeService
  {
    private readonly SuperComposeContext ctx;
    private readonly ConnectionService connectionService;
    private readonly CryptoService crypto;
    private readonly NodeUpdaterService nodeUpdater;

    public NodeService(SuperComposeContext ctx, ConnectionService connectionService, CryptoService crypto,
      NodeUpdaterService nodeUpdater)
    {
      this.ctx = ctx;
      this.connectionService = connectionService;
      this.crypto = crypto;
      this.nodeUpdater = nodeUpdater;
    }

    public async Task<Guid> Create(
      string name,
      ConnectionParams conn
    )
    {
      await connectionService.TestConnection(conn);

      var node = new Node
      {
        Host = conn.host,
        Enabled = true,
        Id = Guid.NewGuid(),
        Name = name,
        Port = conn.port,
        Username = conn.username,
        Password = string.IsNullOrWhiteSpace(conn.password) ? null : await crypto.EncryptSecret(conn.password),
        PrivateKey = string.IsNullOrWhiteSpace(conn.privateKey) ? null : await crypto.EncryptSecret(conn.privateKey)
      };

      await ctx.Nodes.AddAsync(node);
      await ctx.SaveChangesAsync();

      await nodeUpdater.NotifyAboutNodeChange(node.Id);

      return node.Id;
    }

    public async Task Update(
      Guid id,
      string? name,
      string? host,
      string? username,
      int? port,
      string? password,
      string? privateKey
    )
    {
      var node = await ctx.Nodes.FirstOrDefaultAsync(x => x.Id == id);

      if (node == null) throw new NodeNotFoundException();

      node.Name = name ?? node.Name;
      node.Host = host ?? node.Host;
      node.Username = username ?? node.Username;
      node.Port = port ?? node.Port;

      string? newPassword = null;
      string? newPrivateKey = null;

      if (!string.IsNullOrWhiteSpace(password))
      {
        newPassword = password;
        if (string.IsNullOrWhiteSpace(privateKey)) newPrivateKey = null;
      }

      if (!string.IsNullOrWhiteSpace(privateKey))
      {
        newPrivateKey = privateKey;
        if (string.IsNullOrWhiteSpace(password)) newPassword = null;
      }

      if (newPassword != null || newPrivateKey != null)
      {
        node.Password = newPassword != null ? await crypto.EncryptSecret(newPassword) : null;
        node.PrivateKey = newPrivateKey != null ? await crypto.EncryptSecret(newPrivateKey) : null;
      }

      node.Version = Guid.NewGuid();

      await connectionService.TestConnection(
        new ConnectionParams(
          node.Host,
          node.Username,
          node.Port,
          null, null
        ),
        id
      );

      await ctx.SaveChangesAsync();
      await nodeUpdater.NotifyAboutNodeChange(id);
    }

    public async Task Delete(
      Guid id
    )
    {
      await ctx.Nodes.Where(x => x.Id == id).DeleteAsync();
    }

    public async Task Disable(Guid nodeId)
    {
      var node = await ctx.Nodes.FirstOrDefaultAsync(x => x.Id == nodeId);

      if (node == null) throw new NodeNotFoundException();

      if (node.Enabled == false) return;

      node.Enabled = false;
      node.Version = Guid.NewGuid();
      node.ReconciliationFailed = null;
      await ctx.SaveChangesAsync();

      await nodeUpdater.NotifyAboutNodeChange(nodeId);
    }

    public async Task Enable(Guid nodeId)
    {
      var node = await ctx.Nodes.FirstOrDefaultAsync(x => x.Id == nodeId);

      if (node == null) throw new NodeNotFoundException();

      if (node.Enabled == true) return;

      node.Enabled = true;
      node.Version = Guid.NewGuid();
      node.ReconciliationFailed = null;
      await ctx.SaveChangesAsync();

      await nodeUpdater.NotifyAboutNodeChange(nodeId);
    }

    public async Task Redeploy(Guid nodeId)
    {
      var node = await ctx.Nodes.Include(x => x.Deployments).FirstOrDefaultAsync(x => x.Id == nodeId);

      if (node == null) throw new NodeNotFoundException();

      node.RedeploymentRequestedAt = DateTime.UtcNow;
      node.Version = Guid.NewGuid();
      node.ReconciliationFailed = null;

      foreach (var nodeDeployment in node.Deployments) nodeDeployment.ReconciliationFailed = false;

      await ctx.SaveChangesAsync();

      await nodeUpdater.NotifyAboutNodeChange(nodeId);
    }
  }
}