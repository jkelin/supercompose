using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;
using System.Runtime.CompilerServices;
using backend2.Context;
using supercompose;

namespace supercompose
{
  public partial class Deployment
  {
    public static readonly TimeSpan NodeCheckInterval = TimeSpan.FromHours(1);

    [Required] [Key] public Guid? Id { get; set; }

    [Required] public bool Enabled { get; set; } = false;

    [Required] public Guid? ComposeId { get; set; }

    public Guid? LastDeployedComposeVersionId { get; set; }

    [Required] public Guid? NodeId { get; set; }

    public DateTime? LastCheck { get; set; }
    public DateTime? RedeploymentRequestedAt { get; set; }

    public Guid? LastDeployedNodeVersion { get; set; }

    public bool? LastDeployedAsEnabled { get; set; }

    public bool? ReconciliationFailed { get; set; }

    public virtual Compose Compose { get; set; }
    public virtual ComposeVersion? LastDeployedComposeVersion { get; set; }
    public virtual Node Node { get; set; }

    public virtual ICollection<ConnectionLog> ConnectionLogs { get; set; } =
      new List<ConnectionLog>();
  }
}