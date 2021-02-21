using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend2
{
  public class Startup
  {
    public Startup(IConfiguration configuration)
    {
      Configuration = configuration;
    }

    private IConfiguration Configuration { get; }

    // This method gets called by the runtime. Use this method to add services to the container.
    // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
    public void ConfigureServices(IServiceCollection services)
    {
      // If you need dependency injection with your query object add your query type as a services.
      // services.AddSingleton<Query>();
      services
        .AddRouting();

      services.AddGraphQLServer()
        .AddFiltering()
        .AddSorting()
        .AddProjections()
        .AddQueryType<Query>();
        //.AddMutationType<Mutation>();

      services.AddDbContext<SupercomposeContext>(options =>
        options.UseNpgsql(
          Configuration.GetConnectionString("SupercomposeContext")));
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env, 
    SupercomposeContext ctx, ILogger<Startup> logger)
    {
      Migrate(ctx, logger).Wait();

      if (env.IsDevelopment()) app.UseDeveloperExceptionPage();

      app.UseRouting();

      app.UseEndpoints(endpoints =>
      {
        // By default the GraphQL server is mapped to /graphql
        // This route also provides you with our GraphQL IDE. In order to configure the
        // the GraphQL IDE use endpoints.MapGraphQL().WithToolOptions(...).
        endpoints.MapGraphQL();
      });
    }

    private async Task Migrate(SupercomposeContext ctx, ILogger<Startup> logger)
    {
      for (int i = 0; i < 10; i++)
      {
        if (await ctx.Database.CanConnectAsync())
        {
          await ctx.Database.MigrateAsync();
          return;
        }
        else
        {
          logger.LogInformation("Could not connect to database, delaying");
          await Task.Delay(500);
        }
      }

      throw new ApplicationException("Could not migrate database because connection to database could not be established");
    }
  }
}