using SuperCompose.Context;
using HotChocolate;
using HotChocolate.Data;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SuperCompose.Graphql
{
  public class Query
  {
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Node> GetNodes(
      [Service] IDbContextFactory<SuperComposeContext> ctx)
    {
      return ctx.CreateDbContext().Nodes;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public IQueryable<Node> GetNode(
      [Service] IDbContextFactory<SuperComposeContext> ctx)
    {
      return ctx.CreateDbContext().Nodes;
    }

    [UseProjection]
    [UseFiltering]
    public DbSet<Compose> GetComposes(
      [Service] IDbContextFactory<SuperComposeContext> ctx)
    {
      return ctx.CreateDbContext().Composes;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public DbSet<Compose> GetCompose(
      [Service] IDbContextFactory<SuperComposeContext> ctx)
    {
      return ctx.CreateDbContext().Composes;
    }

    [UseProjection]
    [UseFiltering]
    public DbSet<Deployment> GetDeployments(
      [Service] IDbContextFactory<SuperComposeContext> ctx)
    {
      return ctx.CreateDbContext().Deployments;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public DbSet<Deployment> GetDeployment(
      [Service] IDbContextFactory<SuperComposeContext> ctx)
    {
      return ctx.CreateDbContext().Deployments;
    }

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    [UsePaging(MaxPageSize = 1000)]
    public DbSet<ConnectionLog> GetConnectionLogs(
      [Service] IDbContextFactory<SuperComposeContext> ctx)
    {
      return ctx.CreateDbContext().ConnectionLogs;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public DbSet<ConnectionLog> GetConnectionLog(
      [Service] IDbContextFactory<SuperComposeContext> ctx)
    {
      return ctx.CreateDbContext().ConnectionLogs;
    }

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public DbSet<Container> GetContainers(
      [Service] IDbContextFactory<SuperComposeContext> ctx)
    {
      return ctx.CreateDbContext().Containers;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public DbSet<Container> GetContainer(
      [Service] IDbContextFactory<SuperComposeContext> ctx)
    {
      return ctx.CreateDbContext().Containers;
    }
  }
}