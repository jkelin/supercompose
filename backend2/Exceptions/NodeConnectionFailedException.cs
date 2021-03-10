using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Threading.Tasks;

namespace supercompose
{
  [Serializable]
  public class NodeConnectionFailedException : Exception
  {
    public ConnectionErrorKind Kind { get; set; }

    public enum ConnectionErrorKind
    {
      Authentication,
      DNS,
      PrivateKey,
      Connection,
      TimeOut,
      Unknown
    }

    //
    // For guidelines regarding the creation of new exception types, see
    //    http://msdn.microsoft.com/library/default.asp?url=/library/en-us/cpgenref/html/cpconerrorraisinghandlingguidelines.asp
    // and
    //    http://msdn.microsoft.com/library/default.asp?url=/library/en-us/dncscol/html/csharp07192001.asp
    //

    public NodeConnectionFailedException()
    {
    }

    public NodeConnectionFailedException(string message) : base(message)
    {
    }

    public NodeConnectionFailedException(string message, Exception inner) : base(message, inner)
    {
    }

    protected NodeConnectionFailedException(
      SerializationInfo info,
      StreamingContext context) : base(info, context)
    {
    }
  }
}