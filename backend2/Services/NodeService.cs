using System;
using System.Runtime.Serialization;
using System.Threading;
using System.Threading.Tasks;
using backend2.Services;
using backend2.Util;

namespace supercompose
{
  public class NodeService
  {
    private readonly SupercomposeContext ctx;
    private readonly ConnectionService connectionService;
    private readonly CryptoService crypto;

    public NodeService(SupercomposeContext ctx, ConnectionService connectionService, CryptoService crypto)
    {
      this.ctx = ctx;
      this.connectionService = connectionService;
      this.crypto = crypto;
    }

    public async Task<Guid> Create(
      string name,
      ConnectionParams conn
    )
    {
      using var cts = new CancellationTokenSource();
      await connectionService.TestConnection(conn, cts.Token);

      var node = new Node
      {
        Host = conn.host,
        Enabled = true,
        Id = Guid.NewGuid(),
        Name = name,
        Port = conn.port,
        Username = conn.username,
        Password = conn.password == null ? null : await crypto.EncryptSecret(conn.password),
        PrivateKey = conn.privateKey == null ? null : await crypto.EncryptSecret(conn.privateKey)
      };

      await ctx.Nodes.AddAsync(node);
      await ctx.SaveChangesAsync();

      return node.Id.Value;
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
      throw new NotImplementedException();
    }

    public async Task Delete(
      Guid id
    )
    {
      throw new NotImplementedException();
    }
  }
}