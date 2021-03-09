using System;
using System.Diagnostics;
using System.Linq;
using System.Text;
using HotChocolate;
using HotChocolate.Execution;
using HotChocolate.Execution.Instrumentation;
using HotChocolate.Resolvers;
using Microsoft.Extensions.Logging;

namespace supercompose
{
  public class ConsoleQueryLogger : DiagnosticEventListener
  {
    private static Stopwatch _queryTimer;
    private readonly ILogger<ConsoleQueryLogger> _logger;

    public ConsoleQueryLogger(ILogger<ConsoleQueryLogger> logger)
    {
      _logger = logger;
    }

    public override void ResolverError(IMiddlewareContext context, IError error)
    {
      if (error.Exception != null)
      {
        using var scope = _logger.BeginScope(new
        {
          Resolver = $"{context.Field.DeclaringType.Name}.{context.Field.Name}",
          Document = context.Document.ToString().Replace("\n", Environment.NewLine),
          Variables = string.Join(Environment.NewLine, context.Variables.Select(x => $"{x.Name}: {x.Value}"))
        });

        _logger.LogError(
          new EventId(1, "GraphQL Error"),
          error.Exception,
          "GraphQL error in resolver {name}",
          $"{context.Field.DeclaringType.Name}.{context.Field.Name}"
        );
      }

      base.ResolverError(context, error);
    }
  }
}