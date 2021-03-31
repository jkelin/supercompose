using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace SuperCompose.Context
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