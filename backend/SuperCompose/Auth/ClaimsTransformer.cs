using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using SuperCompose.Context;

namespace SuperCompose.Auth
{
  public class ClaimsTransformer : IClaimsTransformation
  {
    private readonly SuperComposeContext ctx;

    public ClaimsTransformer(SuperComposeContext ctx)
    {
      this.ctx = ctx;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
      var clone = principal.Clone();
      var newIdentity = (ClaimsIdentity?) clone.Identity;

      var sub = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
      if (sub == null || newIdentity == null) return principal;

      var tenants = await ctx.Users.Where(x => x.IDPSubject == sub).SelectMany(x => x.Tenants.Select(y => y.Id))
        .ToArrayAsync();

      foreach (var tenant in tenants) newIdentity.AddClaim(new Claim("tenant", tenant.ToString()));

      return clone;
    }
  }
}