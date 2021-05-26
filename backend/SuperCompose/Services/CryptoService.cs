using System;
using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using ProtoBuf;
using System.Security.Cryptography;
using System.IO;
using Microsoft.AspNetCore.DataProtection;
using SuperCompose.Context;
using SuperCompose.Util;

namespace SuperCompose.Services
{
  public class CryptoService
  {
    private readonly IDataProtectionProvider protectorProvider;

    public CryptoService(IDataProtectionProvider protectorProvider)
    {
      this.protectorProvider = protectorProvider;
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

    public async Task<NodeCredentials> GetNodeCredentials(Node node)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("Get credentials for node");
      return new NodeCredentials
      (
        node.Host,
        node.Username,
        node.Port,
        node.Password == null ? null : await DecryptSecret(node.Password),
        node.PrivateKey == null ? null : await DecryptSecret(node.PrivateKey)
      );
    }
  }
}