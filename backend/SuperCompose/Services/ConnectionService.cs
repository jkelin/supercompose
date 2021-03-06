using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Nito.AsyncEx;
using Renci.SshNet;
using Renci.SshNet.Common;
using SuperCompose.Context;
using SuperCompose.Exceptions;
using SuperCompose.Migrations.Keys;
using SuperCompose.Util;

namespace SuperCompose.Services
{
  public class ConnectionService
  {
    private readonly ILogger<ConnectionService> logger;
    private readonly SuperComposeContext ctx;
    private readonly CryptoService crypto;

    public ConnectionService(ILogger<ConnectionService> logger, SuperComposeContext ctx, CryptoService crypto)
    {
      this.logger = logger;
      this.ctx = ctx;
      this.crypto = crypto;
    }

    /// <exception cref="NodeConnectionFailedException"></exception>
    public async Task<SshClient> CreateSshConnection(NodeCredentials conn, TimeSpan timeout,
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
    public async Task<SftpClient> CreateSftpConnection(NodeCredentials conn, TimeSpan timeout,
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

    public async Task<(string stdout, string stderr, int code)> RunCommand(SshClient ssh, string command,
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

    public async IAsyncEnumerable<(string? stdout, string? stderr, int? code)> StreamLines(SshClient ssh,
      string command, CancellationToken ct = default)
    {
      logger.BeginScope(new
      {
        command
      });
      //try
      //{
      logger.LogDebug("Streaming command lines");
      using var cmd = ssh.CreateCommand(command, Encoding.UTF8);
      var res = cmd.BeginExecute();

      using var stdOut = new StreamReader(cmd.OutputStream, Encoding.UTF8);

      while (!res.IsCompleted && cmd.OutputStream.CanRead && !ct.IsCancellationRequested)
      {
        var line = await stdOut.ReadLineAsync().WaitAsync(ct);
        if (!string.IsNullOrEmpty(line)) yield return (line, null, null);
        else await Task.Delay(500, ct);
      }

      cmd.EndExecute(res);

      ct.ThrowIfCancellationRequested();

      logger.LogDebug("Command finished with {status}", cmd.ExitStatus);
      yield return (cmd.Result, cmd.Error, cmd.ExitStatus);
      //}
      //catch (SshException ex)
      //{
      //  logger.BeginScope(new
      //  {
      //    command
      //  });
      //  logger.LogWarning("Error while running command {message}", ex.Message);

      //  throw;
      //}
    }

    private async Task<ConnectionInfo> PrepareConnectionInfo(NodeCredentials conn, TimeSpan timeout)
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
    private async Task CreateConnectionInner(BaseClient client, NodeCredentials conn, CancellationToken ct)
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

    public async Task TestConnection(NodeCredentials conn, Guid? nodeId = null, CancellationToken ct = default)
    {
      if (nodeId != null)
      {
        var node = await ctx.Nodes.FirstOrDefaultAsync(x => x.Id == nodeId, ct);

        if (node == null) throw new NodeNotFoundException();

        if (string.IsNullOrWhiteSpace(conn.password) && string.IsNullOrWhiteSpace(conn.privateKey))
          conn = conn with
          {
            password = node.Password != null ? await crypto.DecryptSecret(node.Password) : null,
            privateKey = node.PrivateKey != null ? await crypto.DecryptSecret(node.PrivateKey) : null
          };
      }

      using var client = await CreateSshConnection(conn, TimeSpan.FromSeconds(5), ct);
    }

    public async Task<byte[]> ReadFile(SftpClient sftp, string path, CancellationToken ct)
    {
      logger.LogDebug("Opening {path} for reading", path);
      await using var readFs = sftp.OpenRead(path);
      await using var ms = new MemoryStream();
      await readFs.CopyToAsync(ms, ct);

      return ms.ToArray();
    }

    public async Task WriteFile(SftpClient sftp, string path, ReadOnlyMemory<byte> contents)
    {
      logger.LogDebug("Opening {path} for writing", path);
      await using var writeFs = sftp.Open(path, FileMode.Create, FileAccess.Write);

      logger.LogDebug("Writing {bytes}B", contents.Length);
      await writeFs.WriteAsync(contents);
      await writeFs.FlushAsync();
    }

    public async Task EnsureDirectoryExists(SftpClient sftp, string path, CancellationToken ct)
    {
      logger.LogDebug("Ensuring directory exists", path);
      var dir = "";

      foreach (string segment in path.Split('/'))
      {
        if (string.IsNullOrEmpty(segment)) continue;

        dir += "/" + segment;

        // Ignoring leading/ending/multiple slashes
        if (string.IsNullOrWhiteSpace(dir)) continue;

        var dirExists = await Task.Run(() => sftp.Exists(dir), ct);
        if (!dirExists)
        {
          logger.LogDebug("Creating dir", dir);
          await Task.Run(() => sftp.CreateDirectory(dir), ct);
        }
      }
    }
  }
}