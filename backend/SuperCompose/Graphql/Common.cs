using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GreenDonut;
using Microsoft.EntityFrameworkCore;
using SuperCompose.Context;
using SuperCompose.Exceptions;

namespace SuperCompose.Graphql
{
  public enum DeploymentState
  {
    Ok,
    Error,
    Warning
  }


  public static class Common
  {
    public static DeploymentState GetDeploymentState(this IEnumerable<ContainerState> containerStates)
    {
      if (containerStates.Contains(ContainerState.Dead) || containerStates.Contains(ContainerState.Paused))
        return DeploymentState.Error;
      if (containerStates.Contains(ContainerState.Exited) || containerStates.Contains(ContainerState.Created) ||
          containerStates.Contains(ContainerState.Removing) ||
          containerStates.Contains(ContainerState.Restarting)) return DeploymentState.Warning;
      return DeploymentState.Ok;
    }
  }
}