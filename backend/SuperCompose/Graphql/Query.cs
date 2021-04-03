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
      [Service] SuperComposeContext ctx)
    {
      return ctx.Nodes;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public IQueryable<Node> GetNode(
      [Service] SuperComposeContext ctx)
    {
      return ctx.Nodes;
    }

    [UseProjection]
    [UseFiltering]
    public DbSet<Compose> GetComposes(
      [Service] SuperComposeContext ctx)
    {
      return ctx.Composes;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public DbSet<Compose> GetCompose(
      [Service] SuperComposeContext ctx)
    {
      return ctx.Composes;
    }

    [UseProjection]
    [UseFiltering]
    public DbSet<Deployment> GetDeployments(
      [Service] SuperComposeContext ctx)
    {
      return ctx.Deployments;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public DbSet<Deployment> GetDeployment(
      [Service] SuperComposeContext ctx)
    {
      return ctx.Deployments;
    }

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    [UsePaging(MaxPageSize = 1000)]
    public DbSet<ConnectionLog> GetConnectionLogs(
      [Service] SuperComposeContext ctx)
    {
      return ctx.ConnectionLogs;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public DbSet<ConnectionLog> GetConnectionLog(
      [Service] SuperComposeContext ctx)
    {
      return ctx.ConnectionLogs;
    }

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public DbSet<Container> GetContainers(
      [Service] SuperComposeContext ctx)
    {
      return ctx.Containers;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public DbSet<Container> GetContainer(
      [Service] SuperComposeContext ctx)
    {
      return ctx.Containers;
    }
  }
}