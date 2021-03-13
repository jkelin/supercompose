using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using backend2.Context;
using supercompose;

namespace backend2.Services
{
  public class ConnectionLogService
  {
    private readonly SupercomposeContext ctx;
    private readonly AsyncLocal<Scope?> currentScope = new();

    public ConnectionLogService(SupercomposeContext ctx)
    {
      this.ctx = ctx;
    }

    private async ValueTask Log(ConnectionLogSeverity severity, string message, Exception? exception = null)
    {
      await ctx.ConnectionLogs.SingleInsertAsync(new ConnectionLog
      {
        Severity = severity,
        Message = message,
        NodeId = currentScope.Value?.NodeId,
        DeploymentId = currentScope.Value?.DeploymentId,
        ComposeId = currentScope.Value?.ComposeId,
        TenantId = currentScope.Value?.TenantId
      });
    }

    public async ValueTask Info(string message, Exception? exception = null)
    {
      await Log(ConnectionLogSeverity.Info, message, exception);
    }

    public async ValueTask Error(string message, Exception? exception = null)
    {
      await Log(ConnectionLogSeverity.Error, message, exception);
    }

    public async ValueTask Warning(string message, Exception? exception = null)
    {
      await Log(ConnectionLogSeverity.Warning, message, exception);
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