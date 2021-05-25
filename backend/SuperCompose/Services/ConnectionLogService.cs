using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SuperCompose.Context;
using SuperCompose.HostedServices;
using SuperCompose.Util;

namespace SuperCompose.Services
{
  public class ConnectionLogService
  {
    private readonly IMediator mediator;

    public ConnectionLogService(IMediator mediator)
    {
      this.mediator = mediator;
    }

    private async ValueTask Log(ConnectionLogSeverity severity, string message, Exception? exception = null,
      Dictionary<string, dynamic>? metadata = null, Guid? nodeId = null, Guid? deploymentId = null, Guid? composeId = null, Guid? tenantId = null)
    {

      var nodeIdString = Activity.Current?.GetBaggageItem(Extensions.ActivityNodeIdName);
      if (nodeId == null && !string.IsNullOrEmpty(nodeIdString) && Guid.TryParse(nodeIdString, out var nodeIdParsed))
      {
        nodeId = nodeIdParsed;
      }

      var tenantIdString = Activity.Current?.GetBaggageItem(Extensions.ActivityTenantIdName);
      if (tenantId == null && !string.IsNullOrEmpty(tenantIdString) && Guid.TryParse(tenantIdString, out var tenantIdParsed))
      {
        tenantId = tenantIdParsed;
      }

      var deploymentIdString = Activity.Current?.GetBaggageItem(Extensions.ActivityDeploymentIdName);
      if (deploymentId == null && !string.IsNullOrEmpty(deploymentIdString) && Guid.TryParse(deploymentIdString, out var deploymentIdParsed))
      {
        deploymentId = deploymentIdParsed;
      }

      var composeIdString = Activity.Current?.GetBaggageItem(Extensions.ActivityComposeIdName);
      if (composeId == null && !string.IsNullOrEmpty(composeIdString) && Guid.TryParse(composeIdString, out var composeIdParsed))
      {
        composeId = composeIdParsed;
      }

      if (tenantId == null)
      {
        throw new InvalidOperationException("TenantId not set while creating connection log");
      }
      
      await mediator.Publish(new SaveConnectionLog
      {
        Log = new ConnectionLog
        {
          Severity = severity,
          Message = message,
          NodeId = nodeId,
          DeploymentId = deploymentId,
          ComposeId = composeId,
          TenantId = tenantId.Value,
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
  }
}