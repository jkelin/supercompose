using System;
using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using ProtoBuf;
using System.Security.Cryptography;
using System.IO;
using Microsoft.AspNetCore.DataProtection;
using IdentityServer4.Stores;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Generic;
using IdentityServer4.Models;
using SuperCompose.Context;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using System.Runtime.Serialization.Formatters.Binary;
using Newtonsoft.Json;

namespace SuperCompose.Services
{
  public class CryptoService
  {
    private readonly IDataProtectionProvider protectorProvider;
    private readonly KeysContext ctx;

    public CryptoService(IDataProtectionProvider protectorProvider, KeysContext ctx)
    {
      this.protectorProvider = protectorProvider;
      this.ctx = ctx;
    }

    public async Task<byte[]> EncryptSecret(string secret)
    {
      var protector = protectorProvider.CreateProtector("crypto-service");
      var bytes = Encoding.UTF8.GetBytes(secret);
      return await Task.Run(() => protector.Protect(bytes));
    }

    public async Task<string> DecryptSecret(byte[] encrypted)
    {
      var protector = protectorProvider.CreateProtector("crypto-service");

      var bytes = await Task.Run(() => protector.Unprotect(encrypted));
      return Encoding.UTF8.GetString(bytes);
    }
  }
}