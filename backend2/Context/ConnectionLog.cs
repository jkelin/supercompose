using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using supercompose;

namespace backend2.Context
{
  public enum ConnectionLogSeverity
  {
    Info,
    Error,
    Warning
  }

  public partial class ConnectionLog
  {
    [Required] [Key] public Guid Id { get; set; } = Guid.NewGuid();

    [Required] public ConnectionLogSeverity Severity { get; set; }

    [Required] public string Message { get; set; } = "";

    [Required] public DateTime Time { get; set; }


    public Guid? NodeId { get; set; }
    public virtual Node? Node { get; set; }


    public Guid? DeploymentId { get; set; }
    public virtual Deployment? Deployment { get; set; }


    public Guid? TenantId { get; set; }
    public virtual Tenant? Tenant { get; set; }


    public Guid? ComposeId { get; set; }
    public virtual Compose? Compose { get; set; }
  }
}