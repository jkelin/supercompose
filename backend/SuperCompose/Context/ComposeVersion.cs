using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

#nullable disable

namespace SuperCompose.Context
{
  public sealed record ComposeVersion
  {
    [Required] [Key] public Guid Id { get; init; }

    [Required] public string Content { get; init; }

    [Required] public string Directory { get; init; }

    [MaxLength(255)] public string ServiceName { get; init; }

    [Required] public bool ServiceEnabled { get; init; }

    [Required] public Guid ComposeId { get; init; }


    [Required] public Guid TenantId { get; set; }

    public Tenant Tenant { get; init; }


    public DateTime? RedeploymentRequestedAt { get; init; }

    public string ComposePath => Directory + "/docker-compose.yml";

    public string ServicePath => $"/etc/systemd/system/{ServiceName}.service";

    public Compose Compose { get; init; }

    public ICollection<Deployment> Deployments { get; init; } =
      new List<Deployment>();
  }
}