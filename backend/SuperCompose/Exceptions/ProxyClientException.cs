using System;
using System.Runtime.Serialization;

namespace SuperCompose.Exceptions
{
  public record ProxyClientErrorResponse(string Detail, string Type, string Title, int Status);
  
  [Serializable]
  public class ProxyClientException : Exception
  {
    //
    // For guidelines regarding the creation of new exception types, see
    //    http://msdn.microsoft.com/library/default.asp?url=/library/en-us/cpgenref/html/cpconerrorraisinghandlingguidelines.asp
    // and
    //    http://msdn.microsoft.com/library/default.asp?url=/library/en-us/dncscol/html/csharp07192001.asp
    //

    public ProxyClientErrorResponse? ErrorResponse { get; set; }

    public ProxyClientException()
    {
    }

    public ProxyClientException(string message) : base(message)
    {
    }

    public ProxyClientException(string message, Exception inner) : base(message, inner)
    {
    }

    protected ProxyClientException(
      SerializationInfo info,
      StreamingContext context) : base(info, context)
    {
    }
  }
}