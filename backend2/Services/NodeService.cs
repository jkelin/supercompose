using System;
using System.Threading.Tasks;

namespace backend2
{
  public class NodeService
  {
    private readonly SupercomposeContext ctx;
    private readonly CryptoService crypto;

    public NodeService(SupercomposeContext ctx, CryptoService crypto)
    {
      this.ctx = ctx;
      this.crypto = crypto;
    }

    public async Task<Guid> Create(
      string name,
      string host,
      string username,
      int port,
      string password,
      string privateKey
    )
    {
      var node = new Node
      {
        Host = host,
        Enabled = true,
        Id = Guid.NewGuid(),
        Name = name,
        Port = port,
        Username = username,
        Password = password == null ? null : await crypto.EncryptSecret(password),
        PrivateKey = privateKey == null ? null : await crypto.EncryptSecret(privateKey)
      };

      await ctx.Nodes.AddAsync(node);
      await ctx.SaveChangesAsync();

      return node.Id.Value;
    }

    public async Task<Guid> TestConnection(
      string host,
      string username,
      int port,
      string password,
      string privateKey
    )
    {
      throw new NotImplementedException();
    }
  }
}