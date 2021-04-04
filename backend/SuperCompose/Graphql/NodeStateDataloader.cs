using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GreenDonut;
using HotChocolate.Data;
using HotChocolate.DataLoader;
using HotChocolate.Fetching;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using SuperCompose.Context;
using SuperCompose.Exceptions;

namespace SuperCompose.Graphql
{
  public class NodeStateDataloader : BatchDataLoader<Guid, DeploymentState>
  {
    private readonly IDbContextFactory<SuperComposeContext> dbContextFactory;

    public NodeStateDataloader(IBatchScheduler batchScheduler, IDbContextFactory<SuperComposeContext> dbContextFactory)
      : base(batchScheduler)
    {
      this.dbContextFactory = dbContextFactory;
    }

    protected override async Task<IReadOnlyDictionary<Guid, DeploymentState>> LoadBatchAsync(IReadOnlyList<Guid> keys,
      CancellationToken cancellationToken)
    {
      await using var ctx = dbContextFactory.CreateDbContext();

      var items = await ctx.Nodes
        .Where(x => keys.Contains(x.Id))
        .Select(x => new {x.Id, States = x.Deployments.SelectMany(y => y.Containers.Select(z => z.State))})
        .ToArrayAsync(cancellationToken);

      return items
        .ToDictionary(k => k.Id, k => k.States.GetDeploymentState());
    }
  }
}