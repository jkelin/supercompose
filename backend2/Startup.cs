using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Threading.Tasks;
using backend2;
using backend2.HostedServices;
using backend2.Services;
using HotChocolate;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RedLockNet;
using RedLockNet.SERedis;
using RedLockNet.SERedis.Configuration;
using StackExchange.Redis;
using StackExchange.Redis.Extensions.Core.Abstractions;
using StackExchange.Redis.Extensions.Core.Configuration;

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
      services.AddSingleton<IConnectionMultiplexer>(action =>
        ConnectionMultiplexer.Connect(configuration.GetConnectionString("Redis")));
      services.AddStackExchangeRedisCache(action =>
      {
        action.InstanceName = "Redis";
        action.Configuration = configuration.GetConnectionString("Redis");
      });

      services.AddSingleton<IDistributedLockFactory>(provider =>
        RedLockFactory.Create(new List<RedLockMultiplexer>
        {
          new(provider.GetRequiredService<IConnectionMultiplexer>())
        })
      );

      services.AddControllers();

      services
        .AddScoped<Query>()
        .AddScoped<Mutation>()
        .AddScoped<ComposeService>()
        .AddScoped<CryptoService>()
        .AddScoped<DeploymentService>()
        .AddScoped<ConnectionService>()
        .AddScoped<NodeUpdaterService>()
        .AddScoped<ConnectionLogService>()
        .AddScoped<NodeService>();

      services
        .AddHostedService<NodeUpdateListener>()
        .AddHostedService<ConnectionLogProcessor>();

      services
        .AddRouting();

      services.AddLogging();

      services.AddMediatR(typeof(Startup));

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
  }
}