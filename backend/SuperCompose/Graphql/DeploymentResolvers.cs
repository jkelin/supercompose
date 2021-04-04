using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HotChocolate;
using HotChocolate.Types;
using SuperCompose.Context;

namespace SuperCompose.Graphql
{
  [ExtendObjectType(Name = "Deployment")]
  public class DeploymentResolvers
  {
    public Task<DeploymentState> CurrentState([Parent] Deployment self,
      DeploymentStateDataloader deploymentStateDataloader, CancellationToken ct)
    {
      return deploymentStateDataloader.LoadAsync(self.Id, ct);
    }
  }
}