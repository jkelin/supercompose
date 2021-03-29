using System;
using System.Linq;
using System.Threading.Tasks;
using backend2.Context;
using backend2.Exceptions;
using HotChocolate;
using HotChocolate.Data;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;

namespace supercompose
{
  public class Query
  {
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Node> GetNodes(
      [Service] SupercomposeContext ctx)
    {
      return ctx.Nodes;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public IQueryable<Node> GetNode(
      [Service] SupercomposeContext ctx)
    {
      return ctx.Nodes;
    }

    [UseProjection]
    [UseFiltering]
    public DbSet<Compose> GetComposes(
      [Service] SupercomposeContext ctx)
    {
      return ctx.Composes;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public DbSet<Compose> GetCompose(
      [Service] SupercomposeContext ctx)
    {
      return ctx.Composes;
    }

    [UseProjection]
    [UseFiltering]
    public DbSet<Deployment> GetDeployments(
      [Service] SupercomposeContext ctx)
    {
      return ctx.Deployments;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public DbSet<Deployment> GetDeployment(
      [Service] SupercomposeContext ctx)
    {
      return ctx.Deployments;
    }


    [UseProjection]
    [UseFiltering]
    [UseSorting]
    [UsePaging(MaxPageSize = 1000)]
    public DbSet<ConnectionLog> GetConnectionLogs(
      [Service] SupercomposeContext ctx)
    {
      return ctx.ConnectionLogs;
    }

    [UseFirstOrDefault]
    [UseProjection]
    [UseFiltering]
    public DbSet<ConnectionLog> GetConnectionLog(
      [Service] SupercomposeContext ctx)
    {
      return ctx.ConnectionLogs;
    }
  }

  public class Person
  {
    public Person(string name)
    {
      Name = name;
    }

    public string Name { get; }

    public async Task<string> Test()
    {
      await Task.Delay(1000);
      return Guid.NewGuid().ToString();
    }
  }
}