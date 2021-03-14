using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using backend2.Util;
using Microsoft.Extensions.Logging;
using Renci.SshNet;
using Renci.SshNet.Common;
using supercompose;

namespace backend2.Services
{
  public class ConnectionService
  {
    private readonly ILogger<ConnectionService> logger;

    public ConnectionService(ILogger<ConnectionService> logger)
    {
      this.logger = logger;
    }

    /// <exception cref="NodeConnectionFailedException"></exception>
    public async Task<SshClient> CreateSshConnection(ConnectionParams conn, TimeSpan timeout,
      CancellationToken ct)
    {
      logger.BeginScope(new
      {
        conn.username,
        conn.host,
        conn.port,
        passwordAvailable = !string.IsNullOrEmpty(conn.password),
        privateKeyAvailable = !string.IsNullOrEmpty(conn.privateKey),
        kind = "ssh_client"
      });

      var connectionInfo = await PrepareConnectionInfo(conn, timeout);

      var client = new SshClient(connectionInfo);

      await CreateConnectionInner(client, conn, ct);

      return client;
    }

    /// <exception cref="NodeConnectionFailedException"></exception>
    public async Task<SftpClient> CreateSftpConnection(ConnectionParams conn, TimeSpan timeout,
      CancellationToken ct)
    {
      logger.BeginScope(new
      {
        conn.username,
        conn.host,
        conn.port,
        passwordAvailable = !string.IsNullOrEmpty(conn.password),
        privateKeyAvailable = !string.IsNullOrEmpty(conn.privateKey),
        kind = "sftp_client"
      });

      var connectionInfo = await PrepareConnectionInfo(conn, timeout);

      var client = new SftpClient(connectionInfo);

      await CreateConnectionInner(client, conn, ct);

      return client;
    }

    public async Task<(string result, string error, int status)> RunCommand(SshClient ssh, string command,
      TimeSpan timeout, CancellationToken ct = default)
    {
      logger.BeginScope(new
      {
        command
      });
      try
      {
        logger.LogDebug("Running command");
        using var cmd = ssh.RunCommand(command);
        cmd.CommandTimeout = timeout;

        var tcs = new TaskCompletionSource<IAsyncResult>();

        cmd.BeginExecute((x) => tcs.SetResult(x));
        await using var registration = ct.Register(() => cmd.CancelAsync());

        await tcs.Task; // TODO there should be some tests around all this code and cancellation especially

        ct.ThrowIfCancellationRequested();

        logger.LogDebug("Command finished with {status}", cmd.ExitStatus);
        return (cmd.Result, cmd.Error, cmd.ExitStatus);
      }
      catch (SshException ex)
      {
        logger.BeginScope(new
        {
          command
        });
        logger.LogWarning("Error while running command {message}", ex.Message);

        throw;
      }
    }

    private async Task<ConnectionInfo> PrepareConnectionInfo(ConnectionParams conn, TimeSpan timeout)
    {
      var authMethods = new List<AuthenticationMethod>();

      if (!string.IsNullOrEmpty(conn.password))
        authMethods.Add(new PasswordAuthenticationMethod(conn.username, conn.password));

      if (!string.IsNullOrEmpty(conn.privateKey))
      {
        await using var pkMs = new MemoryStream(Encoding.UTF8.GetBytes(conn.privateKey));

        try
        {
          var pkFile = new PrivateKeyFile(pkMs);
          authMethods.Add(new PrivateKeyAuthenticationMethod(conn.username, pkFile));
        }
        catch (Exception ex)
        {
          logger.LogDebug("Failed to parse private key {error}", ex.Message);
          throw new NodeConnectionFailedException(ex.Message, ex)
          {
            Kind = NodeConnectionFailedException.ConnectionErrorKind.PrivateKey
          };
        }
      }

      var connectionInfo = new ConnectionInfo(
        conn.host,
        conn.port,
        conn.username,
        authMethods.ToArray()
      )
      {
        Timeout = timeout
      };
      return connectionInfo;
    }

    /// <exception cref="NodeConnectionFailedException"></exception>
    private async Task CreateConnectionInner(BaseClient client, ConnectionParams conn, CancellationToken ct)
    {
      try
      {
        logger.LogDebug("Resolving host");
        await Dns.GetHostEntryAsync(conn.host);
        logger.LogDebug("Resolved");
      }
      catch (Exception ex)
      {
        logger.LogDebug("Host resolution failed");
        client.Dispose();
        throw new NodeConnectionFailedException(ex.Message, ex)
        {
          Kind = NodeConnectionFailedException.ConnectionErrorKind.DNS
        };
      }

      try
      {
        logger.LogDebug("Connecting");
        client.Connect();
        logger.LogDebug("Connected");
      }
      catch (SshAuthenticationException ex)
      {
        logger.LogDebug("Connection failed because to authenticate {error}", ex.Message);
        client.Dispose();
        throw new NodeConnectionFailedException(ex.Message, ex)
        {
          Kind = NodeConnectionFailedException.ConnectionErrorKind.Authentication
        };
      }
      catch (SshConnectionException ex)
      {
        logger.LogDebug("Connection failed due to SSH connection error {error}", ex.Message);
        client.Dispose();
        throw new NodeConnectionFailedException(ex.Message, ex)
        {
          Kind = NodeConnectionFailedException.ConnectionErrorKind.Connection
        };
      }
      catch (SocketException ex)
      {
        logger.LogDebug("Connection failed due to socket exception {error}", ex.Message);
        client.Dispose();
        throw new NodeConnectionFailedException(ex.Message, ex)
        {
          Kind = NodeConnectionFailedException.ConnectionErrorKind.Connection
        };
      }
      catch (TaskCanceledException)
      {
        logger.LogDebug("Connection cancelled");
        client.Dispose();
        throw;
      }
      catch (Exception ex)
      {
        logger.LogDebug("Connection failed for unknown reason {error}", ex.Message);
        client.Dispose();
        throw new NodeConnectionFailedException(ex.Message, ex)
        {
          Kind = NodeConnectionFailedException.ConnectionErrorKind.Unknown
        };
      }
    }

    public async Task TestConnection(ConnectionParams conn, CancellationToken ct)
    {
      using var client = await CreateSshConnection(conn, TimeSpan.FromSeconds(5), ct);
    }
  }
}