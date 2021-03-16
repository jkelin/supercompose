using System;
using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using ProtoBuf;
using System.Security.Cryptography;
using System.IO;

namespace supercompose
{
  public class CryptoService
  {
    private readonly IConfiguration configuration;

    private enum EncAlg
    {
      AES_256_CBC = 1
    }

    private enum KeyAlg
    {
      PBKDF2_SHA256_1000_32 = 1
    }

    [ProtoContract]
    private class EncryptedContainer
    {
      [ProtoMember(1)] [Required] public EncAlg EncAlg { get; set; }

      [ProtoMember(2)] [Required] public KeyAlg KeyAlg { get; set; }

      [ProtoMember(3)] [Required] public byte[] IV { get; set; }

      [ProtoMember(4)] [Required] public byte[] Data { get; set; }
    }

    public CryptoService(IConfiguration configuration)
    {
      this.configuration = configuration;
    }

    private async Task<byte[]> Key(byte[] salt, int outputBytes)
    {
      var key = Encoding.UTF8.GetBytes(configuration["CryptoKey"]);
      Rfc2898DeriveBytes k1 = new(key, salt, 1000, HashAlgorithmName.SHA256);
      return k1.GetBytes(outputBytes);
    }

    public async Task<byte[]> EncryptSecret(string secret)
    {
      using RNGCryptoServiceProvider rngCsp = new();
      using Aes aesAlg = Aes.Create();

      aesAlg.Mode = CipherMode.CBC;
      aesAlg.Padding = PaddingMode.PKCS7;
      aesAlg.GenerateIV();

      var container = new EncryptedContainer
      {
        EncAlg = EncAlg.AES_256_CBC,
        KeyAlg = KeyAlg.PBKDF2_SHA256_1000_32
      };

      container.IV = aesAlg.IV;

      aesAlg.Key = await Key(container.IV, aesAlg.KeySize / 8);

      // Create an encryptor to perform the stream transform.
      ICryptoTransform encryptor = aesAlg.CreateEncryptor();

      // Create the streams used for encryption.
      await using MemoryStream msEncrypt = new();
      await using CryptoStream csEncrypt = new(msEncrypt, encryptor, CryptoStreamMode.Write);
      await using StreamWriter swEncrypt = new(csEncrypt);
      //Write all data to the stream.
      await swEncrypt.WriteAsync(secret);
      await swEncrypt.FlushAsync();
      await csEncrypt.FlushFinalBlockAsync();
      await csEncrypt.FlushAsync();

      container.Data = msEncrypt.ToArray();

      await using (MemoryStream ms = new())
      {
        Serializer.Serialize(ms, container);

        return ms.ToArray();
      }
    }

    public async Task<string> DecryptSecret(byte[] encrypted)
    {
      await using MemoryStream ms = new(encrypted);
      var container = Serializer.Deserialize<EncryptedContainer>(ms);

      if (container == null) throw new InvalidOperationException("Secret is not a valid container");

      using Aes aesAlg = Aes.Create();

      aesAlg.Mode = CipherMode.CBC;
      aesAlg.Padding = PaddingMode.PKCS7;
      aesAlg.IV = container.IV;

      aesAlg.Key = await Key(container.IV, aesAlg.KeySize / 8);

      // Create a decryptor to perform the stream transform.
      ICryptoTransform decryptor = aesAlg.CreateDecryptor();

      // Create the streams used for decryption.
      await using MemoryStream msDecrypt = new(container.Data);
      await using CryptoStream csDecrypt = new(msDecrypt, decryptor, CryptoStreamMode.Read);
      using StreamReader srDecrypt = new(csDecrypt);

      return await srDecrypt.ReadToEndAsync();
    }
  }
}