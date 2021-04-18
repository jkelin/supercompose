using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SuperCompose.Util
{
  public static class Extensions
  {

    public static Guid Tenant(this ClaimsPrincipal claims)
    {
      return claims.FindAll("tenant")
        .Select(x => Guid.Parse(x.Value))
        .First();
    }
    public static Guid[] Tenants(this ClaimsPrincipal claims)
    {
      return claims.FindAll("tenant").Select(x => Guid.Parse(x.Value)).ToArray();
    }
  }
}