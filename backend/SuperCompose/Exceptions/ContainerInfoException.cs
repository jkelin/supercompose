using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Threading.Tasks;

namespace SuperCompose.Exceptions
{
  [Serializable]
  public class ContainerInfoException : Exception
  {
    public string StdErr { get; set; }
    public string Command { get; set; }

    public ContainerInfoException()
    {
    }

    public ContainerInfoException(string message) : base(message)
    {
    }

    public ContainerInfoException(string message, Exception inner) : base(message, inner)
    {
    }

    protected ContainerInfoException(
      SerializationInfo info,
      StreamingContext context) : base(info, context)
    {
    }
  }
}