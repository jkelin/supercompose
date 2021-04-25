using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.EntityFrameworkCore;
using SuperCompose.Context;
using SuperCompose.Util;
#pragma warning disable 1998

namespace SuperCompose.Auth
{

  public record TenantComposeRequirement : IAuthorizationRequirement;
  
  public class TenantComposeAuthorizationHandler : AuthorizationHandler<
    TenantComposeRequirement, Guid>
  {
    private readonly SuperComposeContext ctx;

    public TenantComposeAuthorizationHandler(SuperComposeContext ctx)
    {
      this.ctx = ctx;
    }
    
    protected override async Task HandleRequirementAsync
    (AuthorizationHandlerContext context,
      TenantComposeRequirement requirement, Guid resource)
    {
      var compose = await ctx.Composes
        .Select(x => new {x.Id, x.TenantId})
        .FirstOrDefaultAsync(x => x.Id == resource);

      if (compose == null)
      {
        context.Fail();
      }
      else
      {
        var tenants = context.User.Tenants();
        if (tenants.Contains(compose.TenantId))
        {
          context.Succeed(requirement);
        }
        else
        {
          context.Fail();
        }
      }
    }
  }
}