using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using Docker.DotNet.Models;
using HotChocolate;

namespace SuperCompose.Context
{
  public enum ContainerState
  {
    Created,
    Running,
    Removing,
    Paused,
    Restarting,
    Dead,
    Exited
  }

  public class Container
  {
    [Required] [Key] public Guid Id { get; set; }

    [Required] public string ContainerName { get; set; }

    [Required] public string ServiceName { get; set; }

    [Required] public int ContainerNumber { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? FinishedAt { get; set; }

    [Required] public ContainerState State { get; set; }

    [GraphQLIgnore]
    [Column(TypeName = "jsonb")]
    public ContainerInspectResponse? LastInspect { get; set; }

    public DateTime? LastInspectAt { get; set; }

    [Required] public Guid DeploymentId { get; set; }

    public virtual Deployment Deployment { get; set; }

    [Required] public Guid TenantId { get; set; }
    public virtual Tenant Tenant { get; set; }
  }
}