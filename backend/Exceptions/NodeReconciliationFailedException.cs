using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Threading.Tasks;

namespace backend.Exceptions
{
  [Serializable]
  public class NodeReconciliationFailedException : Exception
  {
    //
    // For guidelines regarding the creation of new exception types, see
    //    http://msdn.microsoft.com/library/default.asp?url=/library/en-us/cpgenref/html/cpconerrorraisinghandlingguidelines.asp
    // and
    //    http://msdn.microsoft.com/library/default.asp?url=/library/en-us/dncscol/html/csharp07192001.asp
    //

    public NodeReconciliationFailedException()
    {
    }

    public NodeReconciliationFailedException(string message) : base(message)
    {
    }

    public NodeReconciliationFailedException(string message, Exception inner) : base(message, inner)
    {
    }

    protected NodeReconciliationFailedException(
      SerializationInfo info,
      StreamingContext context) : base(info, context)
    {
    }
  }
}