using System;
using System.Collections.Generic;

#nullable disable

namespace backend2
{
    public partial class Compose
    {
        public Compose()
        {
            ComposeVersions = new HashSet<ComposeVersion>();
            Deployments = new HashSet<Deployment>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; }
        public bool PendingDelete { get; set; }
        public Guid CurrentId { get; set; }
        public Guid? TenantId { get; set; }

        public virtual ComposeVersion Current { get; set; }
        public virtual Tenant Tenant { get; set; }
        public virtual ICollection<ComposeVersion> ComposeVersions { get; set; }
        public virtual ICollection<Deployment> Deployments { get; set; }
    }
}
