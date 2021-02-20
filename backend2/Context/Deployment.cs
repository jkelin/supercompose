using System;
using System.Collections.Generic;

#nullable disable

namespace backend2
{
    public partial class Deployment
    {
        public Guid Id { get; set; }
        public bool Enabled { get; set; }
        public Guid? ComposeId { get; set; }
        public Guid? LastDeployedVersionId { get; set; }
        public Guid? NodeId { get; set; }

        public virtual Compose Compose { get; set; }
        public virtual ComposeVersion LastDeployedVersion { get; set; }
        public virtual Node Node { get; set; }
    }
}
