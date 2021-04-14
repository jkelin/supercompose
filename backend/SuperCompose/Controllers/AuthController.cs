using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Newtonsoft.Json;
using SuperCompose.Context;
using SuperCompose.Services;

namespace SuperCompose.Controllers
{
  [ApiController]
  [Route("/api/auth/")]
  public class AuthController : Controller
  {
    private readonly AuthService authService;
    private readonly SuperComposeContext ctx;

    public AuthController(AuthService authService, SuperComposeContext ctx)
    {
      this.authService = authService;
      this.ctx = ctx;
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> PostLogin(CancellationToken ct)
    {
      var accessToken = await HttpContext.GetTokenAsync("access_token");
      if (string.IsNullOrEmpty(accessToken)) return Unauthorized();

      var (userId, userInfo) = await authService.UpdateUserFromAccessToken(accessToken, ct);
      var user = await ctx.Users.Include(x => x.Tenants).FirstOrDefaultAsync(x => x.Id == userId, ct);

      return Ok(new
      {
        sub = userInfo.Sub,
        name = user.DisplayName,
        email = userInfo.Email,
        picture = user.Picture,
        userId = user.Id,
        tenants = user.Tenants.Select(x => x.Id)
      });
    }
  }
}