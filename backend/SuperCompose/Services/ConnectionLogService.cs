using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SuperCompose.Context;
using SuperCompose.HostedServices;

namespace SuperCompose.Services
{
  public class ConnectionLogService
  {
    private readonly IMediator mediator;
    private readonly AsyncLocal<Scope?> currentScope = new();

    public ConnectionLogService(IMediator mediator)
    {
      this.mediator = mediator;
    }

    private async ValueTask Log(ConnectionLogSeverity severity, string message, Exception? exception = null,
      Dictionary<string, dynamic>? metadata = null)
    {
      await mediator.Publish(new SaveConnectionLog
      {
        Log = new ConnectionLog
        {
          Severity = severity,
          Message = message,
          NodeId = currentScope.Value?.NodeId,
          DeploymentId = currentScope.Value?.DeploymentId,
          ComposeId = currentScope.Value?.ComposeId,
          TenantId = currentScope.Value?.TenantId,
          Time = DateTime.UtcNow,
          Error = exception != null ? $"{exception.GetType().Name}: {exception.Message}" : null,
          Metadata = metadata
        }
      });
    }

    public void Info(string message, Exception? exception = null, Dictionary<string, dynamic>? metadata = null)
    {
      var _ = Log(ConnectionLogSeverity.Info, message, exception, metadata);
    }

    public void Error(string message, Exception? exception = null, Dictionary<string, dynamic>? metadata = null)
    {
      var _ = Log(ConnectionLogSeverity.Error, message, exception, metadata);
    }

    public void Warning(string message, Exception? exception = null, Dictionary<string, dynamic>? metadata = null)
    {
      var _ = Log(ConnectionLogSeverity.Warning, message, exception, metadata);
    }

    public IDisposable BeginScope(Guid? nodeId = null,
      Guid? deploymentId = null, Guid? tenantId = null,
      Guid? composeId = null)
    {
      currentScope.Value ??= new Scope(() => currentScope.Value = null);

      currentScope.Value.NodeId ??= nodeId;
      currentScope.Value.DeploymentId ??= deploymentId;
      currentScope.Value.TenantId ??= tenantId;
      currentScope.Value.ComposeId ??= composeId;

      return currentScope.Value;
    }

    private class Scope : IDisposable
    {
      private readonly Action onDispose;

      public Guid? NodeId = null;
      public Guid? DeploymentId = null;
      public Guid? TenantId = null;
      public Guid? ComposeId = null;

      public Scope(Action onDispose)
      {
        this.onDispose = onDispose;
      }

      public void Dispose()
      {
        onDispose();
      }
    }
  }
}