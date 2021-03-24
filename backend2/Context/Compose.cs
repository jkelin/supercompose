using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using backend2.Context;
using HotChocolate.Data;

#nullable disable

namespace supercompose
{
  public partial class Compose
  {
    [Required] [Key] public Guid? Id { get; set; }

    [Required] [MaxLength(255)] public string Name { get; set; }

    [Required] public Guid? CurrentId { get; set; }

    public Guid? TenantId { get; set; }

    public virtual ComposeVersion Current { get; set; }
    public virtual Tenant Tenant { get; set; }

    public virtual ICollection<ComposeVersion> ComposeVersions { get; set; } = new List<ComposeVersion>();
    public virtual ICollection<Deployment> Deployments { get; set; } = new List<Deployment>();

    public virtual ICollection<ConnectionLog> ConnectionLogs { get; set; } =
      new List<ConnectionLog>();
  }
}