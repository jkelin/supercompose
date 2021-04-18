using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

#nullable disable

namespace SuperCompose.Context
{
  public partial class Tenant
  {
    [Required] [Key] public Guid Id { get; set; }

    public virtual ICollection<Compose> Composes { get; set; } =
      new List<Compose>();

    public virtual ICollection<Node> Nodes { get; set; } = new List<Node>();

    public virtual ICollection<ConnectionLog> ConnectionLogs { get; set; } =
      new List<ConnectionLog>();

    public virtual ICollection<ComposeVersion> ComposeVersions { get; set; } =
      new List<ComposeVersion>();

    public virtual ICollection<Container> Containers { get; set; } =
      new List<Container>();

    public virtual ICollection<Deployment> Deployments { get; set; } =
      new List<Deployment>();

    public Guid? UserId { get; set; }
    public virtual User? User { get; set; }
  }
}