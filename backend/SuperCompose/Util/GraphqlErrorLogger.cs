using HotChocolate;
using HotChocolate.Execution;
using HotChocolate.Execution.Instrumentation;
using HotChocolate.Language;
using HotChocolate.Resolvers;
using HotChocolate.Types;
using Microsoft.Extensions.Logging;
using Sentry;
using System;
using System.Diagnostics;
using System.Linq;
using OpenTelemetry.Trace;

namespace SuperCompose.Util
{
  public class GraphqlErrorLogger : DiagnosticEventListener
  {
    private readonly ILogger<GraphqlErrorLogger> _logger;

    public GraphqlErrorLogger(ILogger<GraphqlErrorLogger> logger)
    {
      _logger = logger;
    }
    
    public override IActivityScope ExecuteRequest(IRequestContext context)
    {
      return new RequestScope(context);
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
        Document = document != null ? document.ToString().Replace("\n", Environment.NewLine) : null,
        Variables = variables != null
          ? string.Join(Environment.NewLine, variables.Select(x => $"{x.Name}: {x.Value}"))
          : null
      });

      if (field != null)
        _logger.LogWarning(
          eventId,
          exception,
          "GraphQL exception in field {name}",
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

      static readonly ActivitySource ActivitySource =
        new ActivitySource("GraphQL");

      private Activity? activity;
      
      public RequestScope(IRequestContext context)
      {
        this.context = context;
        activity = ActivitySource.StartActivity("GraphQLRequest");
      }

      public void Dispose()
      {
        activity?.AddTag("document", context.Request.Query?.ToString().Replace("\n", Environment.NewLine));

        if (context.Variables != null)
        {
          foreach (var variable in context.Variables)
          {
            activity?.AddTag($"variable.{variable.Name.Value}", variable.Value
            .Value);
          }
        }
        
        activity?.Dispose();
      }
    }
  }
}