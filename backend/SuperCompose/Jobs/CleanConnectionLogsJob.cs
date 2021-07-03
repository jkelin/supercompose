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
          .Skip(200)
          .ToArrayAsync();

        connectionLogsToDelete.AddRange(connectionLogs);
      }
      
      var nodes = await ctx.Nodes.Select(x => x.Id).ToArrayAsync();
      foreach (var node in nodes)
      {
        var connectionLogs = await ctx.ConnectionLogs
          .Where(x => x.NodeId == node && x.DeploymentId == null)
          .OrderByDescending(x => x.Time)
          .Select(x=> x.Id)
          .Skip(200)
          .ToArrayAsync();

        connectionLogsToDelete.AddRange(connectionLogs);
      }
      
      var tenants = await ctx.Tenants.Select(x => x.Id).ToArrayAsync();
      foreach (var tenant in tenants)
      {
        var connectionLogs = await ctx.ConnectionLogs
          .Where(x => x.TenantId == tenant && x.DeploymentId == null && x.NodeId == null)
          .OrderByDescending(x => x.Time)
          .Select(x=> x.Id)
          .Skip(200)
          .ToArrayAsync();

        connectionLogsToDelete.AddRange(connectionLogs);
      }
      
      await ctx.ConnectionLogs.Where(x => connectionLogsToDelete.Contains(x.Id)).DeleteAsync();
    }
  }
}