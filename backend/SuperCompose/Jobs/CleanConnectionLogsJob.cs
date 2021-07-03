using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using Quartz;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SuperCompose.Context;
using Z.EntityFramework.Plus;

namespace SuperCompose.Jobs
{
  [DisallowConcurrentExecution]
  public class CleanConnectionLogsJob : IJob
  {
    private readonly SuperComposeContext ctx;

    public CleanConnectionLogsJob(SuperComposeContext ctx)
    {
      this.ctx = ctx;
    }
    
    public async Task Execute(IJobExecutionContext context)
    {
      var connectionLogsToDelete = new List<Guid>();
      
      var deployments = await ctx.Deployments.Select(x => x.Id).ToArrayAsync();
      foreach (var deployment in deployments)
      {
        var connectionLogs = await ctx.ConnectionLogs
          .Where(x => x.DeploymentId == deployment)
          .OrderByDescending(x => x.Time)
          .Select(x=> x.Id)
          .ToArrayAsync();

        connectionLogsToDelete.AddRange(connectionLogs.Skip(200).ToArray());
      }
      
      await ctx.ConnectionLogs.Where(x => connectionLogsToDelete.Contains(x.Id)).DeleteAsync();
    }
  }
}