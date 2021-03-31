using SuperCompose.Services;
using SuperCompose.Util;
using HotChocolate.Data;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SuperCompose.Context;
using SuperCompose.Exceptions;

namespace SuperCompose.Graphql
{
  public class Mutation
  {
    private readonly NodeService nodeService;
    private readonly ComposeService composeService;
    private readonly DeploymentService deploymentService;
    private readonly SuperComposeContext ctx;
    private readonly ConnectionService conn;

    public Mutation(
      NodeService nodeService,
      ComposeService composeService,
      DeploymentService deploymentService,
      SuperComposeContext ctx,
      ConnectionService conn
    )
    {
      this.nodeService = nodeService;
      this.composeService = composeService;
      this.deploymentService = deploymentService;
      this.ctx = ctx;
      this.conn = conn;
    }

    [UnionType("NodeResult")]
    public interface INodeResult
    {
    }

    public class SuccessfulNodeCreation : INodeResult
    {
      public Node? Node { get; set; }
    }

    public class SuccessfulNodeUpdate : INodeResult
    {
      public Node? Node { get; set; }
    }

    public class NodeConnectionFailed : INodeResult
    {
      public string? Error { get; set; }

      public string? Field { get; set; }

      public static NodeConnectionFailed FromNodeConnectionFailedException(NodeConnectionFailedException ex)
      {
        switch (ex.Kind)
        {
          case NodeConnectionFailedException.ConnectionErrorKind.Authentication:
            return new NodeConnectionFailed
            {
              Error = "Authentication failed"
            };
          case NodeConnectionFailedException.ConnectionErrorKind.Connection:
            return new NodeConnectionFailed
            {
              Error = "Connection refused",
              Field = "host"
            };
          case NodeConnectionFailedException.ConnectionErrorKind.TimeOut:
            return new NodeConnectionFailed
            {
              Error = "Connection timed out",
              Field = "host"
            };
          case NodeConnectionFailedException.ConnectionErrorKind.DNS:
            return new NodeConnectionFailed
            {
              Error = "Host not resolvable",
              Field = "host"
            };
          case NodeConnectionFailedException.ConnectionErrorKind.PrivateKey:
            return new NodeConnectionFailed
            {
              Error = "Cannot parse private key",
              Field = "privateKey"
            };
          default:
            return new NodeConnectionFailed
            {
              Error = ex.Message
            };
        }
      }
    }

    public async Task<INodeResult> CreateNode(
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
        var id = await nodeService.Create(name, new ConnectionParams(host, username, port, password, privateKey));

        return await ctx.Nodes.Where(x => x.Id == id).Select(x => new SuccessfulNodeCreation {Node = x}).FirstAsync();
      }
      catch (NodeConnectionFailedException ex)
      {
        return NodeConnectionFailed.FromNodeConnectionFailedException(ex);
      }
    }

    public async Task<NodeConnectionFailed?> TestConnection(
      [Required] [MaxLength(255)] string host,
      [Required] [MaxLength(255)] string username,
      [Range(1, 65535)] int port,
      string? password,
      string? privateKey,
      Guid? nodeId,
      CancellationToken ct
    )
    {
      try
      {
        await conn.TestConnection(new ConnectionParams(host, username, port, password, privateKey), nodeId, ct);
      }
      catch (NodeConnectionFailedException ex)
      {
        return NodeConnectionFailed.FromNodeConnectionFailedException(ex);
      }

      return null;
    }

    public async Task<INodeResult> UpdateNode(
      [Required] Guid id,
      [MaxLength(255)] string name,
      [MaxLength(255)] string host,
      [MaxLength(255)] string username,
      [Range(1, 65535)] int port,
      string? password,
      string? privateKey
    )
    {
      try
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

        return await ctx.Nodes.Where(x => x.Id == id).Select(x => new SuccessfulNodeUpdate {Node = x}).FirstAsync();
      }
      catch (NodeConnectionFailedException ex)
      {
        return NodeConnectionFailed.FromNodeConnectionFailedException(ex);
      }
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
    public async Task<IQueryable<Compose>> RedeployCompose(
      [Required] Guid id
    )
    {
      await composeService.Redeploy(id);

      return ctx.Composes.Where(x => x.Id == id);
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

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Deployment>> RedeployDeployment(
      [Required] Guid id
    )
    {
      await deploymentService.Redeploy(id);

      return ctx.Deployments.Where(x => x.Id == id);
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Node>> EnableNode(
      [Required] Guid node
    )
    {
      await nodeService.Enable(node);

      return ctx.Nodes.Where(x => x.Id == node);
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Node>> DisableNode(
      [Required] Guid node
    )
    {
      await nodeService.Disable(node);

      return ctx.Nodes.Where(x => x.Id == node);
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Node>> RedeployNode(
      [Required] Guid id
    )
    {
      await nodeService.Redeploy(id);

      return ctx.Nodes.Where(x => x.Id == id);
    }
  }
}