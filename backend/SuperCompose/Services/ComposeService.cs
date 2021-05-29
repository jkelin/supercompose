using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using SuperCompose.Context;
using SuperCompose.Exceptions;

namespace SuperCompose.Services
{
  public class ComposeService
  {
    private readonly SuperComposeContext ctx;
    private readonly NodeUpdaterService nodeUpdater;

    public ComposeService(SuperComposeContext ctx, NodeUpdaterService nodeUpdater)
    {
      this.ctx = ctx;
      this.nodeUpdater = nodeUpdater;
    }

    public async Task<Guid> Create(Guid tenantId, string name, string directory, bool 
    serviceEnabled, string content)
    {
      // The complexity in this method is needed because deferred CurrentId
      await using var transaction = await ctx.Database.BeginTransactionAsync();

      var composeId = Guid.NewGuid();
      var versionId = Guid.NewGuid();

      await ctx.Composes.AddAsync(new Compose
      {
        Id = composeId,
        TenantId = tenantId,
        Name = name,
        CurrentId = versionId
      });

      await ctx.SaveChangesAsync();

      await ctx.ComposeVersions.AddAsync(new ComposeVersion
      {
        Id = versionId,
        TenantId = tenantId,
        Content = content,
        Directory = directory,
        ServiceEnabled = serviceEnabled,
        ServiceName = ServiceNameFromCompose(name),
        ComposeId = composeId
      });

      await ctx.SaveChangesAsync();
      await transaction.CommitAsync();

      return composeId;
    }

    public async Task Update(Guid id, string? name, string? directory, bool? serviceEnabled, string? content)
    {
      var compose = await ctx.Composes
        .Include(x => x.Current)
        .Include(x => x.Deployments)
        .FirstOrDefaultAsync(x => x.Id == id);

      if (compose == null) throw new ComposeNotFoundException();

      if (name != null) compose.Name = name;

      if (directory != null || serviceEnabled != null)
      {
        var version = new ComposeVersion
        {
          Id = Guid.NewGuid(),
          Content = content ?? compose.Current.Content,
          Directory = directory ?? compose.Current.Directory,
          ServiceEnabled = serviceEnabled ?? compose.Current.ServiceEnabled,
          ServiceName = name != null ? ServiceNameFromCompose(name) : compose.Current.ServiceName,
          ComposeId = compose.Id
        };

        await ctx.ComposeVersions.AddAsync(version);

        compose.CurrentId = version.Id;
      }

      await ctx.SaveChangesAsync();

      foreach (var deployment in compose.Deployments) await nodeUpdater.NotifyAboutNodeChange(deployment.NodeId);
    }

    public async Task Delete(Guid id)
    {
      var compose = await ctx.Composes.Include(x => x.Deployments).FirstOrDefaultAsync(x => x.Id == id);

      if (compose == null) return;

      ctx.Composes.Remove(compose);

      await ctx.SaveChangesAsync();

      foreach (var nodeId in compose.Deployments.Select(x => x.NodeId))
        await nodeUpdater.NotifyAboutNodeChange(nodeId);
    }

    private string ServiceNameFromCompose(string name)
    {
      name = new Regex("[^a-z0-9_-]", RegexOptions.IgnoreCase).Replace(name, "-");
      name = new Regex("-+", RegexOptions.IgnoreCase).Replace(name, "-");
      name = new Regex("^supercompose-", RegexOptions.IgnoreCase).Replace(name, "");
      return "supercompose-" + name;
    }

    public async Task Redeploy(Guid composeId)
    {
      var compose = await ctx.Composes
        .Include(x => x.Current)
        .Include(x => x.Deployments)
        .FirstOrDefaultAsync(x => x.Id == composeId);

      if (compose == null) throw new ComposeNotFoundException();

      var version = new ComposeVersion
      {
        Id = Guid.NewGuid(),
        Content = compose.Current.Content,
        Directory = compose.Current.Directory,
        ServiceEnabled = compose.Current.ServiceEnabled,
        ServiceName = compose.Current.ServiceName,
        RedeploymentRequestedAt = DateTime.UtcNow,
        TenantId = compose.TenantId,
        ComposeId = compose.Id
      };

      await ctx.ComposeVersions.AddAsync(version);

      compose.CurrentId = version.Id;

      foreach (var deployment in compose.Deployments) deployment.ReconciliationFailed = false;

      await ctx.SaveChangesAsync();

      foreach (var deployment in compose.Deployments) await nodeUpdater.NotifyAboutNodeChange(deployment.NodeId);
    }
  }
}