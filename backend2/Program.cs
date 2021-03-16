using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace supercompose
{
  public class Program
  {
    public static void Main(string[] args)
    {
      var host = CreateHostBuilder(args).Build();

      using (var scope = host.Services.CreateScope())
      {
        using var ctx = scope.ServiceProvider.GetRequiredService<SupercomposeContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        Migrate(ctx, logger).Wait();
      }

      host.Run();
    }

    // ReSharper disable once MemberCanBePrivate.Global
    public static IHostBuilder CreateHostBuilder(string[] args)
    {
      return Host.CreateDefaultBuilder(args)
        .ConfigureWebHostDefaults(webBuilder => { webBuilder.UseStartup<Startup>(); });
    }

    private static async Task Migrate(SupercomposeContext ctx, ILogger logger)
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