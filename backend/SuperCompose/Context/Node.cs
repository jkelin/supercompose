using HotChocolate;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using HotChocolate.Data;

#nullable disable

namespace SuperCompose.Context
{
  public sealed record Node
  {
    private readonly SuperComposeContext ctx;

    public Node()
    {
      
    }

    public Node(SuperComposeContext ctx)
    {
      this.ctx = ctx;
    }
    
    [Required] [Key] public Guid Id { get; set; }

    [Required] public bool Enabled { get; set; }

    [Required] [MaxLength(255)] public string Name { get; set; }

    [Required] [MaxLength(255)] public string Host { get; set; }

    [Required] [Range(1, 65535)] public int Port { get; set; }

    [Required] [MaxLength(255)] public string Username { get; set; }

    [GraphQLIgnore] public byte[] Password { get; set; }

    [GraphQLIgnore] public byte[] PrivateKey { get; set; }

    public int ContainerCount => ctx.Deployments
      .Where(x => x.NodeId == Id)
      .Select(x => x.Containers.Count)
      .Sum();

    public bool? ReconciliationFailed { get; set; }

    public DateTime? RedeploymentRequestedAt { get; set; }

    [Required] public Guid Version { get; set; } = Guid.NewGuid();

    [Required] public Guid TenantId { get; set; }

    public Tenant Tenant { get; set; }

    public ICollection<Deployment> Deployments { get; set; } =
      new List<Deployment>();

    public ICollection<ConnectionLog> ConnectionLogs { get; set; } =
      new List<ConnectionLog>();
  }
}