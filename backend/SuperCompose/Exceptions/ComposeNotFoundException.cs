using System;
using System.Runtime.Serialization;

namespace SuperCompose.Exceptions
{
  [Serializable]
  public class ComposeNotFoundException : Exception
  {
    //
    // For guidelines regarding the creation of new exception types, see
    //    http://msdn.microsoft.com/library/default.asp?url=/library/en-us/cpgenref/html/cpconerrorraisinghandlingguidelines.asp
    // and
    //    http://msdn.microsoft.com/library/default.asp?url=/library/en-us/dncscol/html/csharp07192001.asp
    //

    public ComposeNotFoundException()
    {
    }

    public ComposeNotFoundException(string message) : base(message)
    {
    }

    public ComposeNotFoundException(string message, Exception inner) : base(message, inner)
    {
    }

    protected ComposeNotFoundException(
      SerializationInfo info,
      StreamingContext context) : base(info, context)
    {
    }
  }
}