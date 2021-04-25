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

  public record TenantDeploymentRequirement : IAuthorizationRequirement;
  
  public class TenantDeploymentAuthorizationHandler : AuthorizationHandler<
    TenantDeploymentRequirement, Guid>
  {
    private readonly SuperComposeContext ctx;

    public TenantDeploymentAuthorizationHandler(SuperComposeContext ctx)
    {
      this.ctx = ctx;
    }
    
    protected override async Task HandleRequirementAsync
    (AuthorizationHandlerContext context,
      TenantDeploymentRequirement requirement, Guid resource)
    {
      var deployment = await ctx.Deployments
        .Select(x => new {x.Id, x.TenantId})
        .FirstOrDefaultAsync(x => x.Id == resource);

      if (deployment == null)
      {
        context.Fail();
      }
      else
      {
        var tenants = context.User.Tenants();
        if (tenants.Contains(deployment.TenantId))
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