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

  public record TenantNodeRequirement : IAuthorizationRequirement;
  
  public class TenantNodeAuthorizationHandler : AuthorizationHandler<
    TenantNodeRequirement, Guid>
  {
    private readonly SuperComposeContext ctx;

    public TenantNodeAuthorizationHandler(SuperComposeContext ctx)
    {
      this.ctx = ctx;
    }
    
    protected override async Task HandleRequirementAsync
    (AuthorizationHandlerContext context,
      TenantNodeRequirement requirement, Guid resource)
    {
      var node = await ctx.Nodes
        .Select(x => new {x.Id, x.TenantId})
        .FirstOrDefaultAsync(x => x.Id == resource);

      if (node == null)
      {
        context.Fail();
      }
      else
      {
        var tenants = context.User.Tenants();
        if (tenants.Contains(node.TenantId))
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