using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Threading.Tasks;
using backend;
using backend2;
using backend2.Context;
using backend2.HostedServices;
using backend2.Services;
using HotChocolate;
using HotChocolate.AspNetCore.Subscriptions;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.WebSockets;
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
      // Redis
      services.AddSingleton<IConnectionMultiplexer>(action =>
      {
        return ConnectionMultiplexer.Connect(configuration.GetConnectionString("Redis"));
      });

      // Postgres main
      services.AddDbContext<SupercomposeContext>(options =>
        options.UseNpgsql(
          configuration.GetConnectionString("SupercomposeContext")));

      // Postgres encryption keys
      services.AddDbContext<KeysContext>(options =>
        options.UseNpgsql(
          configuration.GetConnectionString("KeysContext")));

      // Redis distributed cache
      services.AddStackExchangeRedisCache(action =>
      {
        action.InstanceName = "Redis";
        action.Configuration = configuration.GetConnectionString("Redis");
      });

      // Redis distributed locking
      services.AddSingleton<IDistributedLockFactory>(provider =>
        RedLockFactory.Create(new List<RedLockMultiplexer>
        {
          new(provider.GetRequiredService<IConnectionMultiplexer>())
        })
      );

      // Basic ASP.NET setup
      services.AddControllers();
      services.AddRouting();
      services.AddLogging();
      services.AddHealthChecks();

      // Data protection
      services.AddDataProtection().PersistKeysToDbContext<KeysContext>();

      // Mediatr
      services.AddMediatR(typeof(Startup));

      // Graphql
      services.AddGraphQLServer()
        .ModifyRequestOptions(opt => opt.IncludeExceptionDetails = env.IsDevelopment())
        .AddFiltering()
        .AddSorting()
        .AddProjections()
        .AddDiagnosticEventListener(sp =>
          new GraphqlErrorLogger(
            sp.GetApplicationService<ILogger<GraphqlErrorLogger>>()
          ))
        .AddApolloTracing()
        //.UseAutomaticPersistedQueryPipeline()
        .AddQueryType<Query>()
        .AddMutationType<Mutation>()
        .AddSubscriptionType<Subscription>()
        .AddType<Mutation.SuccessfulNodeCreation>()
        .AddType<Mutation.SuccessfulNodeUpdate>()
        .AddType<Mutation.NodeConnectionFailed>();

      //services.AddRedisQueryStorage(s => s.GetRequiredService<IConnectionMultiplexer>().GetDatabase());
      services.AddRedisSubscriptions(s => s.GetRequiredService<IConnectionMultiplexer>());

      // Custom services
      services
        .AddScoped<Query>()
        .AddScoped<Mutation>()
        .AddScoped<Subscription>()
        .AddScoped<ComposeService>()
        .AddScoped<CryptoService>()
        .AddScoped<DeploymentService>()
        .AddScoped<ConnectionService>()
        .AddScoped<NodeUpdaterService>()
        .AddScoped<ConnectionLogService>()
        .AddScoped<NodeService>();

      // Custom hosted services
      services
        .AddHostedService<NodeUpdateListener>()
        .AddHostedService<ConnectionLogProcessor>();
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env,
      SupercomposeContext ctx, ILogger<Startup> logger)
    {
      if (env.IsDevelopment()) app.UseDeveloperExceptionPage();

      app.UseWebSockets();
      app.UseRouting();

      app.UseEndpoints(endpoints =>
      {
        endpoints.MapGraphQL();
        endpoints.MapControllers();
        endpoints.MapHealthChecks("/health");
      });
    }
  }
}