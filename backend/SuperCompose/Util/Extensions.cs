using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SuperCompose.Util
{
  public static class Extensions
  {
    public static readonly ActivitySource SuperComposeActivitySource = new("SuperCompose");

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

    public const string ActivityTenantIdName = "supercompose.tenantid";
    public const string ActivityComposeIdName = "supercompose.composeid";
    public const string ActivityNodeIdName = "supercompose.nodeid";
    public const string ActivityDeploymentIdName = "supercompose.deploymentid";
  }
}