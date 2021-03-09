using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using backend2.Services;
using HotChocolate;
using HotChocolate.Data;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;

namespace supercompose
{
  public class Mutation
  {
    private readonly NodeService nodeService;
    private readonly ComposeService composeService;
    private readonly DeploymentService deploymentService;
    private readonly SupercomposeContext ctx;

    public Mutation(NodeService nodeService, ComposeService composeService, DeploymentService deploymentService,
      SupercomposeContext ctx)
    {
      this.nodeService = nodeService;
      this.composeService = composeService;
      this.deploymentService = deploymentService;
      this.ctx = ctx;
    }

    [UnionType("CreateNodeResult")]
    public interface ICreateNodeResult
    {
    }

    public class SuccessfulNodeCreation : ICreateNodeResult
    {
      public Node Node { get; set; }
    }

    public class NodeConnectionFailed : ICreateNodeResult
    {
      public string Error { get; set; }

      public string? Field { get; set; }
    }

    public async Task<ICreateNodeResult> CreateNode(
      [Required] [MaxLength(255)] string name,
      [Required] [MaxLength(255)] string host,
      [Required] [MaxLength(255)] string username,
      [Required] [Range(1, 65535)] int port,
      string? password,
      string? privateKey
    )
    {
      try
      {
        var id = await nodeService.Create(name, host, username, port, password, privateKey);

        return await ctx.Nodes.Where(x => x.Id == id).Select(x => new SuccessfulNodeCreation {Node = x}).FirstAsync();
      }
      catch (NodeConnectionFailedException ex)
      {
        return new NodeConnectionFailed
        {
          Error = ex.Message
        };
      }
    }

    public async Task<NodeConnectionFailed?> TestConnection(
      [Required] [MaxLength(255)] string host,
      [Required] [MaxLength(255)] string username,
      [Range(1, 65535)] int port,
      string? password,
      string? privateKey
    )
    {
      await nodeService.TestConnection(host, username, port, password, privateKey);

      return null;
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Node>> UpdateNode(
      [Required] Guid id,
      [MaxLength(255)] string name,
      [MaxLength(255)] string host,
      [MaxLength(255)] string username,
      [Range(1, 65535)] int port,
      string? password,
      string? privateKey
    )
    {
      await nodeService.Update(
        id,
        name,
        host,
        username,
        port,
        password,
        privateKey
      );

      return ctx.Nodes.Where(x => x.Id == id);
    }

    public async Task<bool> DeleteNode([Required] Guid id)
    {
      await nodeService.Delete(id);

      return true;
    }


    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Compose>> CreateCompose(
      [Required] [MaxLength(255)] string name,
      [Required] [MaxLength(255)] string directory,
      [Required] bool serviceEnabled,
      [Required] string compose
    )
    {
      var id = await composeService.Create(name, directory, serviceEnabled, compose);

      return ctx.Composes.Where(x => x.Id == id);
    }


    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Compose>> UpdateCompose(
      [Required] Guid id,
      [MaxLength(255)] string? name,
      [MaxLength(255)] string? directory,
      bool? serviceEnabled,
      string? compose
    )
    {
      await composeService.Update(
        id,
        name,
        directory,
        serviceEnabled,
        compose
      );

      return ctx.Composes.Where(x => x.Id == id);
    }

    public async Task<bool> DeleteCompose([Required] Guid id)
    {
      await composeService.Delete(id);

      return true;
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Deployment>> CreateDeployment(
      [Required] Guid node,
      [Required] Guid compose
    )
    {
      var id = await deploymentService.Create(node, compose);

      return ctx.Deployments.Where(x => x.Id == id);
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Deployment>> EnableDeployment(
      [Required] Guid deployment
    )
    {
      await deploymentService.Enable(deployment);

      return ctx.Deployments.Where(x => x.Id == deployment);
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Deployment>> DisableDeployment(
      [Required] Guid deployment
    )
    {
      await deploymentService.Disable(deployment);

      return ctx.Deployments.Where(x => x.Id == deployment);
    }
  }
}