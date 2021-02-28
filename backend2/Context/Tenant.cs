using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

#nullable disable

namespace backend2
{
  public partial class Tenant
  {
    [Required]
    [Key]
    public Guid? Id { get; set; }

    public virtual ICollection<Compose> Composes { get; set; } =
      new List<Compose>();

    public virtual ICollection<Node> Nodes { get; set; } = new List<Node>();
  }
}
