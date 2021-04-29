using SuperCompose.Context;
using HotChocolate;
using HotChocolate.Data;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using HotChocolate.AspNetCore.Authorization;
using SuperCompose.Util;

namespace SuperCompose.Graphql
{
  public class Query
  {
    [Authorize]
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Node> GetNodes(
      [Service] IDbContextFactory<SuperComposeContext> ctx,
      [GlobalState("ClaimsPrincipal")] ClaimsPrincipal user)
    {
      var tenant = user.Tenant();
      return ctx.CreateDbContext().Nodes.Where(x => x.TenantId == tenant);
    }

    [Authorize]
    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public IQueryable<Node> GetNode(
      [Service] IDbContextFactory<SuperComposeContext> ctx,
      [GlobalState("ClaimsPrincipal")] ClaimsPrincipal user)
    {
      var tenant = user.Tenant();
      return ctx.CreateDbContext().Nodes.Where(x => x.TenantId == tenant);
    }

    [Authorize]
    [UseProjection]
    [UseFiltering]
    public IQueryable<Compose> GetComposes(
      [Service] IDbContextFactory<SuperComposeContext> ctx,
      [GlobalState("ClaimsPrincipal")] ClaimsPrincipal user)
    {
      var tenant = user.Tenant();
      return ctx.CreateDbContext().Composes.Where(x => x.TenantId == tenant);
    }

    [Authorize]
    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public IQueryable<Compose> GetCompose(
      [Service] IDbContextFactory<SuperComposeContext> ctx,
      [GlobalState("ClaimsPrincipal")] ClaimsPrincipal user)
    {
      var tenant = user.Tenant();
      return ctx.CreateDbContext().Composes.Where(x => x.TenantId == tenant);
    }

    [Authorize]
    [UseProjection]
    [UseFiltering]
    public IQueryable<Deployment> GetDeployments(
      [Service] IDbContextFactory<SuperComposeContext> ctx,
      [GlobalState("ClaimsPrincipal")] ClaimsPrincipal user)
    {
      var tenant = user.Tenant();
      return ctx.CreateDbContext().Deployments.Where(x => x.TenantId == tenant);
    }

    [Authorize]
    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public IQueryable<Deployment> GetDeployment(
      [Service] IDbContextFactory<SuperComposeContext> ctx,
      [GlobalState("ClaimsPrincipal")] ClaimsPrincipal user)
    {
      var tenant = user.Tenant();
      return ctx.CreateDbContext().Deployments
        .Where(x => x.TenantId == tenant);
    }

    [Authorize]
    [UsePaging(MaxPageSize = 1000)]
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<ConnectionLog> GetConnectionLogs(
      [Service] IDbContextFactory<SuperComposeContext> ctx,
      [GlobalState("ClaimsPrincipal")] ClaimsPrincipal user)
    {
      var tenant = user.Tenant();
      return ctx.CreateDbContext().ConnectionLogs
        .Where(x => x.TenantId == tenant);
      ;
    }

    [Authorize]
    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public IQueryable<ConnectionLog> GetConnectionLog(
      [Service] IDbContextFactory<SuperComposeContext> ctx,
      [GlobalState("ClaimsPrincipal")] ClaimsPrincipal user)
    {
      var tenant = user.Tenant();
      return ctx.CreateDbContext().ConnectionLogs
        .Where(x => x.TenantId == tenant);
      ;
    }

    [Authorize]
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Container> GetContainers(
      [Service] IDbContextFactory<SuperComposeContext> ctx,
      [GlobalState("ClaimsPrincipal")] ClaimsPrincipal user)
    {
      var tenant = user.Tenant();
      return ctx.CreateDbContext().Containers.Where(x => x.TenantId == tenant);
      ;
    }

    [Authorize]
    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public IQueryable<Container> GetContainer(
      [Service] IDbContextFactory<SuperComposeContext> ctx,
      [GlobalState("ClaimsPrincipal")] ClaimsPrincipal user)
    {
      var tenant = user.Tenant();
      return ctx.CreateDbContext().Containers.Where(x => x.TenantId == tenant);
    }
  }
}