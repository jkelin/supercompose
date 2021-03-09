using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ProtoBuf;
using supercompose;
using Z.EntityFramework.Plus;

namespace backend2.Services
{
  public class ComposeService
  {
    private readonly SupercomposeContext ctx;

    public ComposeService(SupercomposeContext ctx)
    {
      this.ctx = ctx;
    }

    public async Task<Guid> Create(string name, string directory, bool serviceEnabled, string content)
    {
      // The complexity in this method is needed because deferred CurrentId
      await using var transaction = await ctx.Database.BeginTransactionAsync();

      var composeId = Guid.NewGuid();
      var versionId = Guid.NewGuid();

      await ctx.Composes.AddAsync(new Compose
      {
        Id = composeId,
        Name = name,
        PendingDelete = false,
        CurrentId = versionId
      });

      await ctx.SaveChangesAsync();

      await ctx.ComposeVersions.AddAsync(new ComposeVersion
      {
        Id = versionId,
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
      var compose = await ctx.Composes.Include(x => x.Current).FirstOrDefaultAsync(x => x.Id == id);

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
    }

    public async Task Delete(Guid id)
    {
      await ctx.Composes.Where(x => x.Id == id).DeleteAsync();
    }

    private string ServiceNameFromCompose(string name)
    {
      name = new Regex("[^a-z0-9_-]", RegexOptions.IgnoreCase).Replace(name, "-");
      name = new Regex("-+", RegexOptions.IgnoreCase).Replace(name, "-");
      return name;
    }
  }
}