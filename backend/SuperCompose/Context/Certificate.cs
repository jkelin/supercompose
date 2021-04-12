using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace SuperCompose.Context
{
  /// <summary>
  /// Identity Server certificate
  /// </summary>
  public class Certificate
  {
    [Required] [Key] public Guid Id { get; set; }

    [Required] public string Key { get; set; }

    [Required] public DateTime From { get; set; }

    [Required] public DateTime To { get; set; }
  }
}
