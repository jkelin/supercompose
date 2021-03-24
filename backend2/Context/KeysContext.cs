using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace backend2.Context
{
  public class KeysContext : DbContext, IDataProtectionKeyContext
  {
    // A recommended constructor overload when using EF Core 
    // with dependency injection.
    public KeysContext(DbContextOptions<KeysContext> options)
      : base(options)
    {
    }

    // This maps to the table that stores keys.
    public DbSet<DataProtectionKey> DataProtectionKeys { get; set; }
  }
}