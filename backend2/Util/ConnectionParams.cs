using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace backend2.Util
{
  public record ConnectionParams(
    [MaxLength(255)] string host,
    [MaxLength(255)] string username,
    [Range(1, 65535)] int port,
    string? password,
    string? privateKey
  );
}