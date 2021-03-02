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

    enum EncAlg
    {
      AES_256_GCM = 1,
    }

    enum KeyAlg
    {
      PBKDF2_SHA256_1000_32 = 1,
    }

    [ProtoContract]
    class EncryptedContainer
    {
      [ProtoMember(1)]
      [Required]
      public EncAlg EncAlg { get; set; }

      [ProtoMember(2)]
      [Required]
      public KeyAlg KeyAlg { get; set; }

      [ProtoMember(3)]
      [Required]
      public byte[] Salt { get; set; }

      [ProtoMember(4)]
      [Required]
      public byte[] IV { get; set; }

      [ProtoMember(5)]
      [Required]
      public byte[] Data { get; set; }
    }

    public CryptoService(IConfiguration configuration)
    {
      this.configuration = configuration;
    }

    private async Task<byte[]> Key(byte[] salt)
    {
      var key = Encoding.UTF8.GetBytes(configuration["CryptoKey"]);
      Rfc2898DeriveBytes k1 = new Rfc2898DeriveBytes(key, salt, 1000, HashAlgorithmName.SHA256);
      return k1.GetBytes(32);
    }

    public async Task<byte[]> EncryptSecret(string secret)
    {
      using RNGCryptoServiceProvider rngCsp = new RNGCryptoServiceProvider();

      var iv = new byte[16];
      var salt = new byte[64];

      rngCsp.GetBytes(iv);
      rngCsp.GetBytes(salt);

      var key = await Key(salt);

      byte[] encrypted;

      using (Aes aesAlg = Aes.Create())
      {
        aesAlg.Key = key;
        aesAlg.IV = iv;

        // Create an encryptor to perform the stream transform.
        ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, aesAlg.IV);

        // Create the streams used for encryption.
        using (MemoryStream msEncrypt = new MemoryStream())
        {
          using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
          {
            using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
            {
              //Write all data to the stream.
              swEncrypt.Write(secret);
            }

            encrypted = msEncrypt.ToArray();
          }
        }
      }

      var container = new EncryptedContainer
      {
        Data = encrypted,
        EncAlg = EncAlg.AES_256_GCM,
        IV = iv,
        KeyAlg = KeyAlg.PBKDF2_SHA256_1000_32,
        Salt = salt
      };

      using (MemoryStream ms = new MemoryStream())
      {
        Serializer.Serialize(ms, container);

        return ms.ToArray();
      }
    }

    public async Task<string> DecryptSecret(byte[] secret)
    {
      using MemoryStream ms = new MemoryStream(secret);
      var container = Serializer.Deserialize<EncryptedContainer>(ms);

      if (container == null)
      {
        throw new InvalidOperationException("Secret is not a valid container");
      }

      var key = await Key(container.Salt);

      using (Aes aesAlg = Aes.Create())
      {
        aesAlg.Key = key;
        aesAlg.IV = container.IV;

        // Create a decryptor to perform the stream transform.
        ICryptoTransform decryptor = aesAlg.CreateDecryptor(aesAlg.Key, aesAlg.IV);

        // Create the streams used for decryption.
        using (MemoryStream msDecrypt = new MemoryStream(secret))
        {
          using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
          {
            using (StreamReader srDecrypt = new StreamReader(csDecrypt))
            {
              return srDecrypt.ReadToEnd();
            }
          }
        }
      }
    }
  }
}