using System;
using System.Threading.Tasks;
using backend2.Services;
using HotChocolate;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace supercompose
{
  public class Startup
  {
    private readonly IConfiguration configuration;
    private readonly IWebHostEnvironment env;

    public Startup(IConfiguration configuration, IWebHostEnvironment env)
    {
      this.configuration = configuration;
      this.env = env;
    }

    // This method gets called by the runtime. Use this method to add services to the container.
    // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
    public void ConfigureServices(IServiceCollection services)
    {
      services.AddControllers();

      // If you need dependency injection with your query object add your query type as a services.
      // services.AddSingleton<Query>();
      services
        .AddScoped<Query>()
        .AddScoped<Mutation>()
        .AddScoped<ComposeService>()
        .AddScoped<CryptoService>()
        .AddScoped<DeploymentService>()
        .AddScoped<NodeService>();

      services
        .AddRouting();

      services.AddLogging();

      services.AddGraphQLServer()
        .ModifyRequestOptions(opt => opt.IncludeExceptionDetails = env.IsDevelopment())
        .AddFiltering()
        .AddSorting()
        .AddDiagnosticEventListener(sp =>
          new ConsoleQueryLogger(
            sp.GetApplicationService<ILogger<ConsoleQueryLogger>>()
          ))
        .AddApolloTracing()
        .AddProjections()
        .AddQueryType<Query>()
        .AddMutationType<Mutation>()
        .AddType<Mutation.SuccessfulNodeCreation>()
        .AddType<Mutation.NodeConnectionFailed>();

      services.AddDbContext<SupercomposeContext>(options =>
        options.UseNpgsql(
          configuration.GetConnectionString("SupercomposeContext")));
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
        endpoints.MapControllers();
      });
    }

    private async Task Migrate(SupercomposeContext ctx, ILogger<Startup> logger)
    {
      for (var i = 0; i < 10; i++)
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

      throw new ApplicationException(
        "Could not migrate database because connection to database could not be established");
    }
  }
}