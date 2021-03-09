using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using supercompose;
using Z.EntityFramework.Plus;

namespace backend2.Services
{
  public class DeploymentService
  {
    private readonly SupercomposeContext ctx;

    public DeploymentService(SupercomposeContext ctx)
    {
      this.ctx = ctx;
    }

    public async Task<Guid> Create(Guid nodeId, Guid composeId)
    {
      var nodeQuery = ctx.Nodes.Where(x => x.Id == nodeId).FutureValue();
      var composeQuery = ctx.Composes.Where(x => x.Id == composeId).FutureValue();

      var node = await nodeQuery.ValueAsync();
      if (node == null) throw new NodeNotFoundException();

      var compose = await composeQuery.ValueAsync();
      if (compose == null) throw new ComposeNotFoundException();

      var deployment = new Deployment
      {
        Id = Guid.NewGuid(),
        Node = node,
        Compose = compose,
        Enabled = true,
        LastDeployedVersionId = compose.CurrentId
      };

      await ctx.Deployments.AddAsync(deployment);
      await ctx.SaveChangesAsync();

      return deployment.Id.Value;
    }
  }
}