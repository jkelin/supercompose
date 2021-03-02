using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using HotChocolate.Data;

namespace supercompose
{
  public class Mutation
  {
    private readonly NodeService nodeService;
    private readonly SupercomposeContext ctx;

    public Mutation(NodeService nodeService, SupercomposeContext ctx)
    {
      this.nodeService = nodeService;
      this.ctx = ctx;
    }

    public record CreateNodeInput([MaxLength(255)] string name, [MaxLength(255)] string host, [MaxLength(255)] string username, [Range(1, 65535)] int port, string? password, string? privateKey);

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Node>> CreateNode(CreateNodeInput node)
    {
      var id = await nodeService.Create(node.name, node.host, node.username, node.port, node.password, node.privateKey);

      return ctx.Nodes.Where(x => x.Id == id);
    }

    public record TestConnectionInput([MaxLength(255)] string host, [MaxLength(255)] string username, [Range(1, 65535)] int port, string? password, string? privateKey);

    public async Task TestConnection(CreateNodeInput node)
    {
      await nodeService.TestConnection(node.host, node.username, node.port, node.password, node.privateKey);
    }
  }
}