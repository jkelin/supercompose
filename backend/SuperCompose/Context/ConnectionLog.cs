using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SuperCompose.Context
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

    public string? Error { get; set; }

    [Column(TypeName = "jsonb")] public Dictionary<string, dynamic>? Metadata { get; set; }


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