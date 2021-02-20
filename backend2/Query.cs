using System;
using System.Linq;
using System.Threading.Tasks;
using HotChocolate;
using HotChocolate.Data;

namespace backend2
{
  public class Query
  {
    public Person GetPerson()
    {
      return new($"Luke Skywalker {Guid.NewGuid()}");
    }

    [UseFiltering]
    [UseSorting]
    public IQueryable<Node> GetNodes(
      [Service] SupercomposeContext ctx)
    {
      return ctx.Nodes;
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