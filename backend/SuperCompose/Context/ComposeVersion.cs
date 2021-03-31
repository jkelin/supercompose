using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

#nullable disable

namespace SuperCompose.Context
{
  public partial class ComposeVersion
  {
    [Required] [Key] public Guid Id { get; set; }

    [Required] public string Content { get; set; }

    [Required] public string Directory { get; set; }

    [MaxLength(255)] public string ServiceName { get; set; }

    [Required] public bool ServiceEnabled { get; set; }

    [Required] public Guid ComposeId { get; set; }

    [Required] public bool PendingDelete { get; set; } = false;

    public DateTime? RedeploymentRequestedAt { get; set; }

    public string ComposePath => Directory + "/docker-compose.yml";

    public string ServicePath => $"/etc/systemd/system/{ServiceName}.service";


    public virtual Compose ComposeNavigation { get; set; }
    public virtual Compose Compose { get; set; }

    public virtual ICollection<Deployment> Deployments { get; set; } =
      new List<Deployment>();
  }
}