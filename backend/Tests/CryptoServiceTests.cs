using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SuperCompose;
using SuperCompose.Services;
using Xunit;

namespace BackendTests
{
  public class CryptoServiceTests : IClassFixture<WebApplicationFactory<Startup>>
  {
    private readonly WebApplicationFactory<Startup> factory;

    public CryptoServiceTests(WebApplicationFactory<Startup> factory)
    {
      this.factory = factory.WithWebHostBuilder(builder =>
      {
        builder.ConfigureAppConfiguration((context, conf) =>
        {
          var projectDir = Directory.GetCurrentDirectory();
          var configPath = Path.Combine(projectDir, "appsettings.json");
          conf.Sources.Clear();
          conf.AddJsonFile(configPath);
        });
      });

      Program.Migrate(this.factory.Services).Wait();
    }

    //public static IConfigurationRoot GetIConfigurationRoot()
    //{
    //  return new ConfigurationBuilder()
    //    .AddJsonFile("appsettings.json", true)
    //    .AddEnvironmentVariables()
    //    .Build();
    //}

    //private readonly CryptoService crypto = new(GetIConfigurationRoot());

    public const string TestPkey = @"
-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgQCf03DiSdNfKz4ShO+oSeiav/+GBSCWn0SFj8jc/q8Nui3vU8mP
qOqbkVYfok+l0qdZ3pRild7lZe5VVjlGWPmML/eKIjsWmliFAN3NJciXiop/L8h4
qFe2cd39XkH1wtWgyBuqc1UxTEwi1yuABOEpD+7N+gt2sUNWFDl0Ct8JmwIDAQAB
AoGAGXmMTqVRyaOM20rRIFPXfYMI6YW7sgZk150ZeRAnOtroI3OJdxqHepBp19T5
OQcgoZR2tlgJFStwF64Mpwfbjpo2IcckOFiGBIPVv9SpvdKgPjIDSu1jZqjWTCN9
5sLjPe5P1QCIPI8oOzA6O9d3LWCFpTjhzhXqoZqvTaD6r/ECQQDScudHirY4+Vql
n2GoaMDDXyy6QSjlp/eLkwIZMLnKGYBibaUXOUc2SN+BYnx0aSc/loCVXI1sq1Z/
eWRFqJENAkEAwmt+A3f5VbKP0ae1yOpXL4S0FrL1wQ+dqYqHW14hiKPLqbeL5Oz7
NOvTbMl0DwwCNpyu3oG+4K+JbNSjySBLRwJAKj1J0oAy5uiVmxyMW2L7HbuinJer
f7zg4LDXAPtYrwnDTP443ppugqTJx4xe8naQnCC3GkODV0ZkjB1vVNPqmQJAHjVj
jBhtJnKrRBFB/qjiySBedxRxeQD7J2e95mV24mtI7uL1Gqnz0mI+JK4cmWXtRh0M
UshoJzM/MCjOFictawJAZEI5lolW0PBAAnaQvSsiIlylJr9VLkhqILcHcbXEGnqt
FPMvduLHybgz/CAzmQGL/N/x11HoAehLlivXxXxEEg==
-----END RSA PRIVATE KEY-----";

    [Theory]
    [InlineData("Test 123")]
    [InlineData("Abrakadabra")]
    [InlineData("")]
    [InlineData(TestPkey)]
    public async Task EncryptAndDecrypt(string dataIn)
    {
      using var scope = factory.Services.CreateScope();

      var crypto = scope.ServiceProvider.GetRequiredService<CryptoService>();

      var encrypted = await crypto.EncryptSecret(dataIn);

      encrypted.Should().NotBeSameAs(Encoding.UTF8.GetBytes(dataIn), "Encryption should do something with the data");

      var decrypted = await crypto.DecryptSecret(encrypted);

      decrypted.Should().BeEquivalentTo(dataIn, "Decrypted data should equal initial data");
    }
  }
}