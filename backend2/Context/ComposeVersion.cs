using System;
using System.Collections.Generic;

#nullable disable

namespace backend2
{
    public partial class ComposeVersion
    {
        public ComposeVersion()
        {
            Deployments = new HashSet<Deployment>();
        }

        public Guid Id { get; set; }
        public string Content { get; set; }
        public string Directory { get; set; }
        public string ServiceName { get; set; }
        public bool ServiceEnabled { get; set; }
        public Guid? ComposeId { get; set; }

        public virtual Compose ComposeNavigation { get; set; }
        public virtual Compose Compose { get; set; }
        public virtual ICollection<Deployment> Deployments { get; set; }
    }
}
