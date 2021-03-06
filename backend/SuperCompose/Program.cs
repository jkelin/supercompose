using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;
using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Serilog;
using Serilog.Events;
using SuperCompose.Context;

namespace SuperCompose
{
  public class Program
  {
    public static void Main(string[] args)
    {
      var host = CreateHostBuilder(args).Build();

      Activity.DefaultIdFormat = ActivityIdFormat.W3C;
      Activity.ForceDefaultIdFormat = true;

      Migrate(host.Services).Wait();

      host.Run();
    }

    // ReSharper disable once MemberCanBePrivate.Global
    public static IHostBuilder CreateHostBuilder(string[] args)
    {
      return Host.CreateDefaultBuilder(args)
        .UseSerilog((host, logger) =>
        {
          logger.ReadFrom.Configuration(host.Configuration);
          
          logger.WriteTo.Sentry(o =>
          {
            o.MinimumBreadcrumbLevel = LogEventLevel.Debug;
            o.MaxBreadcrumbs = 50;
            o.Debug = true;
          });
          
          logger.WriteTo.Seq(
            host.Configuration["Seq:ServerUrl"],
            Enum.TryParse(host.Configuration["Seq:MinimumLevel"], out LogEventLevel level) ? level : LogEventLevel.Information 
          );

          logger.WriteTo.Console();
          logger.Enrich.FromLogContext();
        })
        .ConfigureWebHostDefaults(webBuilder =>
        {
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