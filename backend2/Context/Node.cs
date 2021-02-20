using System;
using System.Collections.Generic;

#nullable disable

namespace backend2
{
    public partial class Node
    {
        public Node()
        {
            Deployments = new HashSet<Deployment>();
        }

        public Guid Id { get; set; }
        public bool Enabled { get; set; }
        public string Name { get; set; }
        public string Host { get; set; }
        public int Port { get; set; }
        public string Username { get; set; }
        public byte[] Password { get; set; }
        public byte[] PrivateKey { get; set; }
        public Guid? TenantId { get; set; }

        public virtual Tenant Tenant { get; set; }
        public virtual ICollection<Deployment> Deployments { get; set; }
    }
}
