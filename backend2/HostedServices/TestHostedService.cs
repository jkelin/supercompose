using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using RedLockNet;

namespace backend2.HostedServices
{
  public class TestHostedService : IHostedService, IDisposable
  {
    private readonly IDistributedLockFactory lockFactory;

    public TestHostedService(IDistributedLockFactory lockFactory)
    {
      this.lockFactory = lockFactory;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
      using var lok = await lockFactory.CreateLockAsync("kokos", TimeSpan.MaxValue);

      await Task.Delay(10000);
      //throw new NotImplementedException();
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
      //throw new NotImplementedException();
    }

    public void Dispose()
    {
      //throw new NotImplementedException();
    }
  }
}