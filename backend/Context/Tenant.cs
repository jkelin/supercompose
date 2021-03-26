using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using backend2.Context;

#nullable disable

namespace supercompose
{
  public partial class Tenant
  {
    [Required] [Key] public Guid? Id { get; set; }

    public virtual ICollection<Compose> Composes { get; set; } =
      new List<Compose>();

    public virtual ICollection<Node> Nodes { get; set; } = new List<Node>();

    public virtual ICollection<ConnectionLog> ConnectionLogs { get; set; } =
      new List<ConnectionLog>();
  }
}