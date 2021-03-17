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
    private readonly byte[] cryptoKey;

    private enum EncAlg
    {
      // ReSharper disable once InconsistentNaming
      // ReSharper disable once IdentifierTypo
      AES_256_CBC_PKCS7 = 1
    }

    private enum KeyAlg
    {
      // ReSharper disable once InconsistentNaming
      PBKDF2_SHA256_1000_32 = 1
    }

    [ProtoContract]
    private class EncryptedContainer
    {
      [ProtoMember(1)] [Required] public EncAlg EncAlg { get; init; }

      [ProtoMember(2)] [Required] public KeyAlg KeyAlg { get; init; }

      [ProtoMember(3)] [Required] public byte[] IV { get; init; }

      [ProtoMember(4)] [Required] public byte[] Data { get; set; }
    }

    public CryptoService(IConfiguration configuration)
    {
      cryptoKey = Encoding.UTF8.GetBytes(configuration["CryptoKey"]);
    }

    private async Task<byte[]> DeriveKey(byte[] salt, int outputBytes, KeyAlg alg)
    {
      Rfc2898DeriveBytes k1 = new(cryptoKey, salt, 1000, HashAlgorithmName.SHA256);
      return await Task.Run(() => k1.GetBytes(outputBytes));
    }

    public async Task<byte[]> EncryptSecret(string secret)
    {
      using RNGCryptoServiceProvider rngCsp = new();
      using Aes alg = Aes.Create();

      alg.Mode = CipherMode.CBC;
      alg.Padding = PaddingMode.PKCS7;
      alg.GenerateIV();

      var container = new EncryptedContainer
      {
        EncAlg = EncAlg.AES_256_CBC_PKCS7,
        KeyAlg = KeyAlg.PBKDF2_SHA256_1000_32,
        IV = alg.IV
      };

      alg.Key = await DeriveKey(alg.IV, alg.KeySize / 8, container.KeyAlg);

      // Create an encryptor to perform the stream transform.
      using var transformer = alg.CreateEncryptor();

      // Create the streams used for encryption.
      await using MemoryStream dataMs = new();
      await using CryptoStream cs = new(dataMs, transformer, CryptoStreamMode.Write);
      await using StreamWriter sw = new(cs);

      await sw.WriteAsync(secret);
      await sw.FlushAsync();
      await cs.FlushFinalBlockAsync();
      await cs.FlushAsync();

      container.Data = dataMs.ToArray();

      await using MemoryStream containerMs = new();
      Serializer.Serialize(containerMs, container);

      return containerMs.ToArray();
    }

    public async Task<string> DecryptSecret(byte[] encrypted)
    {
      await using MemoryStream containerMs = new(encrypted);
      var container = Serializer.Deserialize<EncryptedContainer>(containerMs);

      if (container == null) throw new InvalidOperationException("Secret is not a valid container");

      using Aes alg = Aes.Create();

      alg.Mode = CipherMode.CBC;
      alg.Padding = PaddingMode.PKCS7;
      alg.IV = container.IV;
      alg.Key = await DeriveKey(container.IV, alg.KeySize / 8, container.KeyAlg);

      var transformer = alg.CreateDecryptor();

      // Create the streams used for decryption.
      await using MemoryStream dataMs = new(container.Data);
      await using CryptoStream cs = new(dataMs, transformer, CryptoStreamMode.Read);
      using StreamReader sr = new(cs);

      return await sr.ReadToEndAsync();
    }
  }
}