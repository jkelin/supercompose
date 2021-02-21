using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

#nullable disable

namespace backend2
{
  public partial class Deployment
  {
    [Required]
    [Key]
    public Guid? Id { get; set; }

    [Required]
    public bool? Enabled { get; set; }

    [Required]
    public Guid? ComposeId { get; set; }

    [Required]
    public Guid? LastDeployedVersionId { get; set; }

    [Required]
    public Guid? NodeId { get; set; }

    public virtual Compose Compose { get; set; }
    public virtual ComposeVersion LastDeployedVersion { get; set; }
    public virtual Node Node { get; set; }
  }
}
