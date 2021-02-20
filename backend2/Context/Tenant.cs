using System;
using System.Collections.Generic;

#nullable disable

namespace backend2
{
    public partial class Tenant
    {
        public Tenant()
        {
            Composes = new HashSet<Compose>();
            Nodes = new HashSet<Node>();
        }

        public Guid Id { get; set; }

        public virtual ICollection<Compose> Composes { get; set; }
        public virtual ICollection<Node> Nodes { get; set; }
    }
}
