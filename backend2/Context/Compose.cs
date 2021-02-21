using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using HotChocolate.Data;

#nullable disable

namespace backend2
{
  public partial class Compose
  {
    private readonly SupercomposeContext ctx;

    [Required]
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; }

    [Required]
    public bool? PendingDelete { get; set; }

    [Required]
    public Guid? CurrentId { get; set; }

    //[IsProjected(true)]
    //[NotMapped]
    public string Content () => Current.Content;
    
    [IsProjected(true)]
    [NotMapped]
    public string Directory { get; set; }
    
    [IsProjected(true)]
    [NotMapped]
    public string ServiceName { get; set; }

    [IsProjected(true)]
    [NotMapped]
    public bool ServiceEnabled { get; set; }
    
    public Guid? TenantId { get; set; }

    public virtual ComposeVersion Current { get; set; }
    public virtual Tenant Tenant { get; set; }

    public virtual ICollection<ComposeVersion> ComposeVersions { get; set; } =
      new List<ComposeVersion>();

    public virtual ICollection<Deployment> Deployments { get; set; } =
      new List<Deployment>();
  }
}
