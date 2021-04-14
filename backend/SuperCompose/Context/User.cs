using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Policy;
using System.Threading.Tasks;
using HotChocolate;
using Microsoft.EntityFrameworkCore;

namespace SuperCompose.Context
{
  [Index(nameof(IDPSubject), IsUnique = true)]
  public class User
  {
    [Key] public Guid Id { get; set; }

    public string DisplayName { get; set; }

    [GraphQLIgnore] public byte[] EncryptedEmail { get; set; }

    [GraphQLIgnore] public string IDPSubject { get; set; }

    public bool EmailVerified { get; set; } = false;

    public string? Picture { get; set; }

    public virtual ICollection<Tenant> Tenants { get; set; } =
      new List<Tenant>();
  }
}