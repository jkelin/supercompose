using System;
using System.ComponentModel.DataAnnotations;

namespace SuperCompose.Util
{
  public record NodeCredentials(
    [MaxLength(255)] string host,
    [MaxLength(255)] string username,
    [Range(1, 65535)] int port,
    string? password,
    string? privateKey
  );
}