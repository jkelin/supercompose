using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace supercompose
{
  public class Program
  {
    public static void Main(string[] args)
    {
      CreateHostBuilder(args).Build().Run();
    }

    // ReSharper disable once MemberCanBePrivate.Global
    public static IHostBuilder CreateHostBuilder(string[] args)
    {
      return Host.CreateDefaultBuilder(args)
        .ConfigureWebHostDefaults(webBuilder =>
        {
          webBuilder.UseStartup<Startup>();
        });
    }
  }
}