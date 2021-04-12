using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;
using System;
using System.Threading.Tasks;
using SuperCompose.Context;
using IdentityServer4.EntityFramework.DbContexts;

namespace SuperCompose
{
  public class Program
  {
    public static void Main(string[] args)
    {
      var host = CreateHostBuilder(args).Build();

      Migrate(host.Services).Wait();

      host.Run();
    }

    // ReSharper disable once MemberCanBePrivate.Global
    public static IHostBuilder CreateHostBuilder(string[] args)
    {
      return Host.CreateDefaultBuilder(args)
        .ConfigureWebHostDefaults(webBuilder =>
        {
          webBuilder.UseStartup<Startup>();
          webBuilder.ConfigureLogging((c, l) =>
          {
            l.AddConfiguration(c.Configuration);
            // Adding Sentry integration to Microsoft.Extensions.Logging
            l.AddSentry(o =>
            {
              o.MinimumBreadcrumbLevel = LogLevel.Debug;
              o.MaxBreadcrumbs = 50;
              o.Debug = true;
            });
          });
        });
    }

    public static async Task Migrate(IServiceProvider provider)
    {
      using var scope = provider.CreateScope();
      
      await Migrate<KeysContext>(scope);
      await Migrate<PersistedGrantDbContext>(scope);
      await Migrate<ConfigurationDbContext>(scope);
      await Migrate<SuperComposeContext>(scope);

      await SeedIDP(scope);
    }

    private static async Task Migrate<TCtx>(IServiceScope scope) where TCtx : DbContext
    {
      await using var ctx = scope.ServiceProvider.GetRequiredService<TCtx>();
      var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

      for (var i = 0; i < 10; i++)
        if (await ctx.Database.CanConnectAsync())
        {
          await ctx.Database.MigrateAsync();

          await using var conn = (NpgsqlConnection) ctx.Database.GetDbConnection();
          conn.Open();
          conn.ReloadTypes();

          return;
        }
        else
        {
          logger.LogInformation("Could not connect to database {db}, delaying", typeof(TCtx).Name);
          await Task.Delay(500);
        }

      throw new ApplicationException(
        $"Could not migrate database because connection to database {typeof(TCtx).Name} could not be established");
    }

    private async static Task SeedIDP(IServiceScope scope)
    {
      await using var ctx = scope.ServiceProvider.GetRequiredService<ConfigurationDbContext>();
      await using var trx = ctx.Database.BeginTransaction(System.Data.IsolationLevel.Serializable);

      if (!await ctx.Clients.AnyAsync())
      {
        //foreach (var client in Config.Clients)
        //{
        //  ctx.Clients.Add(client.ToEntity());
        //}
      }

      if (!await ctx.IdentityResources.AnyAsync())
      {
        //foreach (var resource in Config.IdentityResources)
        //{
        //  ctx.IdentityResources.Add(resource.ToEntity());
        //}
      }

      if (!await ctx.ApiScopes.AnyAsync())
      {
        //foreach (var resource in Config.ApiScopes)
        //{
        //  ctx.ApiScopes.Add(resource.ToEntity());
        //}
      }

      await ctx.SaveChangesAsync();
      await trx.CommitAsync();
    }
  }
}