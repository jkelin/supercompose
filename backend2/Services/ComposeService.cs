using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ProtoBuf;

namespace backend2.Services
{
  public class ComposeService
  {
    public async Task<Guid> Create(string name, string directory, bool serviceEnabled, string compose)
    {
      throw new NotImplementedException();
    }

    public async Task Update(Guid id, string? name, string? directory, bool? serviceEnabled, string? compose)
    {
      throw new NotImplementedException();
    }

    public async Task Delete(Guid id)
    {
      throw new NotImplementedException();
    }
  }
}