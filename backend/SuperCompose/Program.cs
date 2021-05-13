using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;
using System;
using System.Threading.Tasks;
using SuperCompose.Context;

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
          webBuilder.ConfigureLogging((c, l) =>
          {
            l.AddSeq(c.Configuration.GetSection("Seq"));
            l.AddConfiguration(c.Configuration);
            // Adding Sentry integration to Microsoft.Extensions.Logging
            l.AddSentry(o =>
            {
              o.MinimumBreadcrumbLevel = LogLevel.Debug;
              o.MaxBreadcrumbs = 50;
              o.Debug = true;
            });
          });
          webBuilder.UseStartup<Startup>();
        });
    }

    public static async Task Migrate(IServiceProvider provider)
    {
      using var scope = provider.CreateScope();
      await Task.WhenAll(
        Migrate<SuperComposeContext>(scope),
        Migrate<KeysContext>(scope)
      );
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
          logger.LogInformation("Could not connect to database, delaying");
          await Task.Delay(500);
        }

      throw new ApplicationException(
        "Could not migrate database because connection to database could not be established");
    }
  }
}