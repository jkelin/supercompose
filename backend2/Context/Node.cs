using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using HotChocolate;

#nullable disable

namespace backend2
{
  public partial class Node
  {
    [Required]
    [Key]
    public Guid? Id { get; set; }

    [Required]
    public bool? Enabled { get; set; }

    [Required]
    [MaxLength(255)]
    public string Name { get; set; }

    [Required]
    [MaxLength(255)]
    public string Host { get; set; }

    [Required]
    [Range(1, 65535)]
    public int? Port { get; set; }

    [Required]
    [MaxLength(255)]
    public string Username { get; set; }

    [GraphQLIgnore]
    public byte[] Password { get; set; }

    [GraphQLIgnore]
    public byte[] PrivateKey { get; set; }

    public Guid? TenantId { get; set; }

    public virtual Tenant Tenant { get; set; }

    public virtual ICollection<Deployment> Deployments { get; set; } =
      new List<Deployment>();
  }
}
