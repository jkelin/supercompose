using SuperCompose.Services;
using SuperCompose.Util;
using HotChocolate.Data;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using HotChocolate;
using HotChocolate.AspNetCore.Authorization;
using SuperCompose.Context;
using SuperCompose.Exceptions;

namespace SuperCompose.Graphql
{
  public class Mutation
  {
    private readonly NodeService nodeService;
    private readonly ComposeService composeService;
    private readonly DeploymentService deploymentService;
    private readonly IDbContextFactory<SuperComposeContext> ctxFactiry;
    private readonly ConnectionService conn;

    public Mutation(
      NodeService nodeService,
      ComposeService composeService,
      DeploymentService deploymentService,
      IDbContextFactory<SuperComposeContext> ctxFactiry,
      ConnectionService conn
    )
    {
      this.nodeService = nodeService;
      this.composeService = composeService;
      this.deploymentService = deploymentService;
      this.ctxFactiry = ctxFactiry;
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

    [Authorize]
    public async Task<INodeResult> CreateNode(
      [Required] [MaxLength(255)] string name,
      [Required] [MaxLength(255)] string host,
      [Required] [MaxLength(255)] string username,
      [Required] [Range(1, 65535)] int port,
      string? password,
      string? privateKey,
      [GlobalState("ClaimsPrincipal")] ClaimsPrincipal user
    )
    {
      var tenant = user.Tenant();
      try
      {
        var id = await nodeService.Create(tenant, name, new ConnectionParams(host, username, port, password, privateKey));

        return await ctxFactiry.CreateDbContext().Nodes.Where(x => x.Id == id)
          .Select(x => new SuccessfulNodeCreation {Node = x}).FirstAsync();
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

        return await ctxFactiry.CreateDbContext().Nodes.Where(x => x.Id == id)
          .Select(x => new SuccessfulNodeUpdate {Node = x}).FirstAsync();
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


    [Authorize]
    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Compose>> CreateCompose(
      [Required] [MaxLength(255)] string name,
      [Required] [MaxLength(255)] string directory,
      [Required] bool serviceEnabled,
      [Required] string compose,
      [GlobalState("ClaimsPrincipal")] ClaimsPrincipal user
    )
    {
      var tenant = user.Tenant();
      var id = await composeService.Create(tenant, name, directory, serviceEnabled, compose);

      return ctxFactiry.CreateDbContext().Composes.Where(x => x.Id == id);
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

      return ctxFactiry.CreateDbContext().Composes.Where(x => x.Id == id);
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

      return ctxFactiry.CreateDbContext().Composes.Where(x => x.Id == id);
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Deployment>> CreateDeployment(
      [Required] Guid node,
      [Required] Guid compose
    )
    {
      var id = await deploymentService.Create(node, compose);

      return ctxFactiry.CreateDbContext().Deployments.Where(x => x.Id == id);
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Deployment>> EnableDeployment(
      [Required] Guid deployment
    )
    {
      await deploymentService.Enable(deployment);

      return ctxFactiry.CreateDbContext().Deployments.Where(x => x.Id == deployment);
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Deployment>> DisableDeployment(
      [Required] Guid deployment
    )
    {
      await deploymentService.Disable(deployment);

      return ctxFactiry.CreateDbContext().Deployments.Where(x => x.Id == deployment);
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Deployment>> RedeployDeployment(
      [Required] Guid id
    )
    {
      await deploymentService.Redeploy(id);

      return ctxFactiry.CreateDbContext().Deployments.Where(x => x.Id == id);
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Node>> EnableNode(
      [Required] Guid node
    )
    {
      await nodeService.Enable(node);

      return ctxFactiry.CreateDbContext().Nodes.Where(x => x.Id == node);
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Node>> DisableNode(
      [Required] Guid node
    )
    {
      await nodeService.Disable(node);

      return ctxFactiry.CreateDbContext().Nodes.Where(x => x.Id == node);
    }

    [UseFirstOrDefault]
    [UseProjection]
    public async Task<IQueryable<Node>> RedeployNode(
      [Required] Guid id
    )
    {
      await nodeService.Redeploy(id);

      return ctxFactiry.CreateDbContext().Nodes.Where(x => x.Id == id);
    }
  }
}