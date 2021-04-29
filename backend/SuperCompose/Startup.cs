using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using SuperCompose.Context;
using SuperCompose.HostedServices;
using SuperCompose.Services;
using HotChocolate;
using HotChocolate.AspNetCore.Serialization;
using HotChocolate.AspNetCore.Subscriptions;
using MediatR;
using Microsoft.AspNetCore.Authentication;
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
using SuperCompose.Exceptions;
using SuperCompose.Graphql;
using SuperCompose.Util;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using SuperCompose.Auth;

namespace SuperCompose
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
        ConnectionMultiplexer.Connect(configuration.GetConnectionString("Redis")));

      // Postgres main
      services.AddPooledDbContextFactory<SuperComposeContext>(options =>
        options.UseNpgsql(
          configuration.GetConnectionString("SuperComposeContext")));
      services.AddDbContext<SuperComposeContext>(options =>
        options.UseNpgsql(
          configuration.GetConnectionString("SuperComposeContext")));

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
      services.AddResponseCaching();
      services.AddResponseCompression();
      services.AddControllers();
      services.AddRouting();
      services.AddLogging();
      services.AddCors(x => x.AddDefaultPolicy(p =>
        p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod().SetPreflightMaxAge(TimeSpan.FromSeconds(3600))));

      // Health check
      services
        .AddHealthChecks()
        .AddRedis(configuration.GetConnectionString("Redis"), "Redis")
        .AddDbContextCheck<SuperComposeContext>()
        .AddDbContextCheck<KeysContext>();
      
      // Data protection
      services
        .AddDataProtection()
        .SetApplicationName("SuperCompose")
        .PersistKeysToDbContext<KeysContext>();

      // Mediatr
      services.AddMediatR(typeof(Startup));

      // Graphql
      services.AddGraphQLServer()
        .ModifyRequestOptions(opt =>
           opt.IncludeExceptionDetails = env.IsDevelopment())
        .AddFiltering()
        .AddSorting()
        .AddProjections()
        .AddDiagnosticEventListener(sp =>
          new GraphqlErrorLogger(
            sp.GetApplicationService<ILogger<GraphqlErrorLogger>>()
          ))
        .AddApolloTracing()
        .AddAuthorization()
        //.UseAutomaticPersistedQueryPipeline()
        .AddDataLoader<DeploymentStateDataloader>()
        .AddDataLoader<NodeStateDataloader>()
        .AddDataLoader<ComposeStateDataloader>()
        .AddQueryType<Query>()
        .AddMutationType<Mutation>()
        .AddSubscriptionType<Subscription>()
        .AddErrorFilter<SuperComposeErrorFilter>()
        .AddType<DeploymentResolvers>()
        .AddType<NodeResolvers>()
        .AddType<ComposeResolvers>()
        .AddType<Mutation.SuccessfulNodeCreation>()
        .AddType<Mutation.SuccessfulNodeUpdate>()
        .AddType<Mutation.NodeConnectionFailed>();

      services.AddHttpResultSerializer(
        batchSerialization: HttpResultSerialization.JsonArray,
        deferSerialization: HttpResultSerialization.MultiPartChunked);

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
        .AddScoped<NodeAgentService>()
        .AddScoped<PubSubService>()
        .AddScoped<AuthService>()
        .AddScoped<NodeService>();

      // Custom hosted services
      services
        .AddHostedService<NodeUpdateListener>()
        .AddHostedService<NodeAgentOrchestrator>()
        .AddHostedService<ConnectionLogProcessor>();

      // HTTP Clients
      services.AddHttpClient("OIDC", client => { client.BaseAddress = new Uri(configuration["Auth:Authority"]); });

      // Auth
      services
        .AddAuthentication(options =>
        {
          options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;
          options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
          options.Authority = configuration["Auth:Authority"];
          options.Audience = configuration["Auth:Audience"];
        });

      services
        .AddScoped<IClaimsTransformation, ClaimsTransformer>()
        .AddScoped<IAuthorizationHandler, TenantNodeAuthorizationHandler>()
        .AddScoped<IAuthorizationHandler, TenantComposeAuthorizationHandler>()
        .AddScoped<IAuthorizationHandler, TenantDeploymentAuthorizationHandler>();
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env,
      SuperComposeContext ctx, ILogger<Startup> logger)
    {
      if (env.IsDevelopment()) app.UseDeveloperExceptionPage();

      app.UseResponseCompression();
      app.UseAuthentication();
      app.UseRouting();
      app.UseAuthorization();
      app.UseWebSockets();
      app.UseCors();
      app.UseResponseCaching();

      app.UseEndpoints(endpoints =>
      {
        endpoints.MapGraphQL();
        endpoints.MapControllers();
        endpoints.MapHealthChecks("/health", new HealthCheckOptions()
        {
          ResponseWriter = async (httpCtx, result) =>
          {
            httpCtx.Response.StatusCode = result.Status == HealthStatus.Healthy ? 200 : 500;
            await httpCtx.Response.WriteAsJsonAsync(result.Entries
            .ToDictionary(x => x.Key, x => new
            {
              Duration = x.Value.Duration.TotalMilliseconds,
              Status = x.Value.Status.ToString(),
            }));
          }
        });
      });
    }
  }
}