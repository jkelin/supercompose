using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Newtonsoft.Json;
using SuperCompose.Context;
using SuperCompose.Controllers;

namespace SuperCompose.Services
{
  public class AuthService
  {
    private readonly SuperComposeContext ctx;
    private readonly ILogger<AuthService> logger;
    private readonly IHttpClientFactory httpClientFactory;
    private readonly CryptoService crypto;
    private readonly IDistributedCache cache;

    public AuthService(SuperComposeContext ctx, ILogger<AuthService> logger, IHttpClientFactory httpClientFactory,
      CryptoService crypto, IDistributedCache cache)
    {
      this.ctx = ctx;
      this.logger = logger;
      this.httpClientFactory = httpClientFactory;
      this.crypto = crypto;
      this.cache = cache;
    }

    public async Task<(Guid UserId, UserInfoResponse UserInfo)> UpdateUserFromAccessToken(string accessToken,
      CancellationToken ct)
    {
      var userInfo = await ReadUserInfo(accessToken, ct);
      if (string.IsNullOrEmpty(userInfo.Sub)) throw new InvalidOperationException("Sub null in userInfo");
      if (string.IsNullOrEmpty(userInfo.Email)) throw new InvalidOperationException("Email null in userInfo");
      if (!userInfo.EmailVerified.HasValue) throw new InvalidOperationException("EmailVerified null in userInfo");

      await using var trx = await ctx.Database.BeginTransactionAsync(ct);
      var user = await ctx.Users.Include(x => x.Tenants).FirstOrDefaultAsync(x => x.IDPSubject == userInfo.Sub, ct);
      if (user == null)
      {
        logger.LogInformation("Registering new user {sub} with email {email}", userInfo.Sub, userInfo.Email);
        user = new User
        {
          Id = Guid.NewGuid(),
          IDPSubject = userInfo.Sub
        };

        var tenant = new Tenant
        {
          Id = Guid.NewGuid(),
          User = user
        };
        await ctx.Tenants.AddAsync(tenant, ct);
      }

      user.EmailVerified = userInfo.EmailVerified.Value;
      user.EncryptedEmail = await crypto.EncryptSecret(userInfo.Email);
      user.DisplayName = userInfo.Name ?? userInfo.Email;
      user.Picture = userInfo.Picture ?? userInfo.Email;

      await ctx.SaveChangesAsync(ct);
      await trx.CommitAsync(ct);

      await CacheTenantsForSub(user.IDPSubject, user.Tenants.Select(x => x.Id), ct);

      return (user.Id, userInfo);
    }

    private async Task CacheTenantsForSub(string sub, IEnumerable<Guid> tenants, CancellationToken ct)
    {
      var opts = new DistributedCacheEntryOptions
      {
        SlidingExpiration = TimeSpan.FromMinutes(10)
      };

      await cache.SetStringAsync($"tenants:{sub}", JsonConvert.SerializeObject(tenants.ToArray()), opts, ct);
    }

    private async Task<Guid[]> GetTenantsForSub(string sub, CancellationToken ct)
    {
      var value = await cache.GetStringAsync($"tenants:{sub}", ct);

      if (value != null) return JsonConvert.DeserializeObject<Guid[]>(value);

      var ids = await ctx.Tenants
        .Where(x => x.User != null && x.User.IDPSubject == sub)
        .Select(x => x.Id)
        .ToArrayAsync(ct);

      await CacheTenantsForSub(sub, ids, ct);

      return ids;
    }

    private async Task<UserInfoResponse> ReadUserInfo(string accessToken, CancellationToken ct)
    {
      using var client = httpClientFactory.CreateClient("OIDC");

      var discoveryString = await client.GetStringAsync("/.well-known/openid-configuration", ct);
      var discovery = OpenIdConnectConfiguration.Create(discoveryString);

      var userInfoMessage = new HttpRequestMessage(HttpMethod.Get, discovery.UserInfoEndpoint);
      userInfoMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
      using var userInfoResponse = await client.SendAsync(userInfoMessage, ct);
      userInfoResponse.EnsureSuccessStatusCode();
      var userInfoString = await userInfoResponse.Content.ReadAsStringAsync(ct);
      var userInfo = JsonConvert.DeserializeObject<UserInfoResponse>(userInfoString);

      return userInfo;
    }

    [Serializable]
    public record UserInfoResponse
    (
      string? Sub,
      string? Nickname,
      string? Name,
      string? Picture,
      string? Email
    )
    {
      [JsonProperty("email_verified")] public bool? EmailVerified { get; set; }
    }
  }
}