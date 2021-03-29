using System;
using backend2;
using backend2.Exceptions;
using HotChocolate;

namespace supercompose
{
  public class SupercomposeErrorFilter : IErrorFilter
  {
    public IError OnError(IError error)
    {
      return error.Exception switch
      {
        ComposeNotFoundException => error
          .WithCode("COMPOSE_NOT_FOUND")
          .WithMessage("Requested compose could not be found"),
        DeploymentNotFoundException => error
          .WithCode("DEPLOYMENT_NOT_FOUND")
          .WithMessage("Requested deployment could not be found"),
        NodeConnectionFailedException => error
          .WithCode("NODE_CONNECTION_FAILED")
          .WithMessage("Node connection has failed"),
        NodeNotFoundException => error
          .WithCode("NODE_NOT_FOUND")
          .WithMessage("Requested node could not be found"),
        _ => error
          .WithCode("UNKNOWN_ERROR")
          .WithMessage("Unknown Error: " + error.Message)
      };
    }
  }
}