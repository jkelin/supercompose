using HotChocolate;
using HotChocolate.Execution;
using HotChocolate.Execution.Instrumentation;
using HotChocolate.Language;
using HotChocolate.Resolvers;
using HotChocolate.Types;
using Microsoft.Extensions.Logging;
using Sentry;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Serilog;
using Serilog.Core;
using ILogger = Serilog.ILogger;

namespace SuperCompose.Util
{
  public class GraphqlLogger : DiagnosticEventListener, IDiagnosticEventListener
  {
    private static Stopwatch _queryTimer;
    private readonly ILogger<GraphqlLogger> _logger;

    public GraphqlLogger(ILogger<GraphqlLogger> logger)
    {
      _logger = logger;
    }

    public override IActivityScope ExecuteRequest(IRequestContext context)
    {
      return new RequestScope(context, _logger);
    }

    public override void TaskError(IExecutionTask task, IError error)
    {
      if (error.Exception != null)
        LogError(new EventId(5, "GraphQL Task Error"), error.Exception);

      base.TaskError(task, error);
    }

    public override void RequestError(IRequestContext context, Exception exception)
    {
      LogError(new EventId(4, "GraphQL Request Error"), exception, context.Document, context.Variables);

      base.RequestError(context, exception);
    }
    
    //public override void SyntaxError(IRequestContext context, IError error)
    //{
    //  if (error.Exception != null)
    //    LogError(new EventId(3, "GraphQL Syntax Error"), error.Exception, context.Document, context.Variables);

    //  base.SyntaxError(context, error);
    //}

    //public override void ValidationErrors(IRequestContext context, IReadOnlyList<IError> errors)
    //{
    //  foreach (var error in errors)
    //    if (error.Exception != null)
    //      LogError(new EventId(2, "GraphQL Validation Error"), error.Exception, context.Document, context.Variables);

    //  base.ValidationErrors(context, errors);
    //}

    public override void ResolverError(IMiddlewareContext context, IError error)
    {
      if (error.Exception != null)
        LogError(new EventId(1, "GraphQL Resolver Error"), error.Exception, context.Document, context.Variables,
          context.Field);

      base.ResolverError(context, error);
    }

    private void LogError(EventId eventId, Exception exception, DocumentNode? document = null,
      IVariableValueCollection? variables = null,
      IObjectField? field = null)
    {
      using var scope = _logger.BeginScope(new
      {
        Resolver = field != null ? $"{field.DeclaringType.Name}.{field.Name}" : null,
        Document = document?.ToString().Replace("\n", Environment.NewLine),
        Variables = variables != null
          ? string.Join(Environment.NewLine, variables.Select(x => $"{x.Name}: {x.Value}"))
          : null
      });

      if (field != null)
        _logger.LogWarning(
          eventId,
          exception,
          "GraphQL exception in field {Name}",
          $"{field.DeclaringType.Name}.{field.Name}"
        );
      else
        _logger.LogWarning(
          eventId,
          exception,
          "GraphQL exception"
        );

      SentrySdk.CaptureException(exception);
    }

    private class RequestScope : IActivityScope
    {
      private readonly IRequestContext context;
      private readonly ILogger<GraphqlLogger> logger;
      private bool disposed;
      private readonly Activity? activity;

      public RequestScope(IRequestContext context, ILogger<GraphqlLogger> logger)
      {
        this.context = context;
        this.logger = logger;
        activity = Extensions.SuperComposeActivitySource.StartActivity("GraphQL request", ActivityKind.Server);
      }
      
      public void Dispose()
      {
        if (disposed) return;
        
        var document = context.Document?.ToString().Replace("\r", "").Replace("\n", Environment.NewLine);
        var variables = context.Variables?.ToDictionary(x => x.Name.Value, x => x.Value.ToString());

        if (!string.IsNullOrEmpty(document))
        {
          activity?.AddTag("graphql.document", document);
        }
        if (variables != null)
        {
          foreach (var (key, value) in variables)
          {
            if (key is not (not "password" or "compose" or "pkey" or "privateKey")) continue;

            activity?.AddTag("graphql.variables." + key, value);
          }
        }
        
        logger.LogTrace("GraphQL Request finished for {@Document} with variables {@Variables}", document, variables);
        activity?.Stop();
        activity?.Dispose();

        disposed = true;
      }
    }
  }
}