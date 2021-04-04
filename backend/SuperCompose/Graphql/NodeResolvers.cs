using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GreenDonut;
using HotChocolate;
using HotChocolate.Data;
using HotChocolate.Resolvers;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using SuperCompose.Context;
using SuperCompose.Exceptions;

namespace SuperCompose.Graphql
{
  [ExtendObjectType(Name = "Node")]
  public class NodeResolvers
  {
    public Task<DeploymentState> CurrentState([Parent] Node self,
      NodeStateDataloader nodeStateDataloader,
      CancellationToken ct)
    {
      return nodeStateDataloader.LoadAsync(self.Id, ct);
    }
  }
}