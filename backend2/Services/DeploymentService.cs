using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend2.Exceptions;
using Microsoft.EntityFrameworkCore;
using supercompose;
using Z.EntityFramework.Plus;

namespace backend2.Services
{
  public class DeploymentService
  {
    private readonly SupercomposeContext ctx;
    private readonly NodeUpdaterService nodeUpdater;

    public DeploymentService(SupercomposeContext ctx, NodeUpdaterService nodeUpdater)
    {
      this.ctx = ctx;
      this.nodeUpdater = nodeUpdater;
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
        Enabled = true
      };

      await ctx.Deployments.AddAsync(deployment);
      await ctx.SaveChangesAsync();

      await nodeUpdater.NotifyAboutNodeChange(node.Id.Value);

      return deployment.Id.Value;
    }

    public async Task Disable(Guid deploymentId)
    {
      var deployment = await ctx.Deployments.FirstOrDefaultAsync(x => x.Id == deploymentId);

      if (deployment == null) throw new DeploymentNotFoundException();

      if (deployment.Enabled == false) return;

      deployment.Enabled = false;
      deployment.ReconciliationFailed = null;
      await ctx.SaveChangesAsync();

      await nodeUpdater.NotifyAboutNodeChange(deployment.NodeId.Value);
    }

    public async Task Enable(Guid deploymentId)
    {
      var deployment = await ctx.Deployments.FirstOrDefaultAsync(x => x.Id == deploymentId);

      if (deployment == null) throw new DeploymentNotFoundException();

      if (deployment.Enabled == true) return;

      deployment.Enabled = true;
      deployment.ReconciliationFailed = null;
      await ctx.SaveChangesAsync();

      await nodeUpdater.NotifyAboutNodeChange(deployment.NodeId.Value);
    }
  }
}