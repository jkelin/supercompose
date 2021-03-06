﻿using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using Docker.DotNet.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using OpenTelemetry.Trace;
using Renci.SshNet.Security;
using SuperCompose.Context;
using SuperCompose.Exceptions;
using SuperCompose.Util;

namespace SuperCompose.Services
{
  public class ProxyClient
  {
    private readonly IHttpClientFactory clientFactory;
    private readonly IConfiguration config;
    private readonly IMemoryCache cache;
    private readonly ILogger<ProxyClient> logger;
    private readonly ConnectionLogService connectionLog;
    private readonly DockerJsonSerializer dockerSerializer;

    public ProxyClient(IHttpClientFactory clientFactory, IConfiguration config, IMemoryCache cache, ILogger<ProxyClient> logger,
      ConnectionLogService connectionLog, DockerJsonSerializer dockerSerializer)
    {
      this.clientFactory = clientFactory;
      this.config = config;
      this.cache = cache;
      this.logger = logger;
      this.connectionLog = connectionLog;
      this.dockerSerializer = dockerSerializer;
    }

    private string MintJwtFromCredentials(NodeCredentials credentials)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.MintJwtFromCredentials");
      try
      {
        var tokenHandler = new JwtSecurityTokenHandler();

        var claims = new List<Claim>
        {
          new("host", $"{credentials.host}:{credentials.port}"),
          new("username", credentials.username),
        };

        if (!string.IsNullOrEmpty(credentials.password))
        {
          claims.Add(new Claim("password", credentials.password));
        }

        if (!string.IsNullOrEmpty(credentials.privateKey))
        {
          claims.Add(new Claim("pkey", credentials.privateKey));
        }

        
        var tokenDescriptor = new SecurityTokenDescriptor
        {
          Subject = new ClaimsIdentity(claims),
          Expires = DateTime.UtcNow + TimeSpan.FromHours(2),
          SigningCredentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Proxy:JWT"])),
            SecurityAlgorithms.HmacSha256Signature
          ),
          Audience = "proxy" 
        };

        return tokenHandler.CreateEncodedJwt(tokenDescriptor);
      }
      catch (Exception ex)
      {
        logger.LogCritical(ex, "Failed to mint JWT for proxy");
        activity.RecordException(ex);
        throw;
      }
    }

    private HttpClient ClientFor(NodeCredentials credentials)
    {
      var client = clientFactory.CreateClient("proxy");

      client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("bearer", MintJwtFromCredentials(credentials));

      return client;
    }

    private async Task<HttpContent> Request(string path, object? body, HttpMethod method, NodeCredentials credentials, CancellationToken ct = default)
    {
      using var client = ClientFor(credentials);

      var request = new HttpRequestMessage();
      if (body != null)
      {
        request.Content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8);
      }

      request.Method = method;
      request.RequestUri = new Uri(path, UriKind.Relative);

      var resp = await client.SendAsync(request, ct);

      if (!resp.IsSuccessStatusCode)
      {
        var errorResponse = await resp.Content.ReadFromJsonAsync<ProxyClientErrorResponse>(cancellationToken: ct)
                            ?? throw new InvalidOperationException("Could not read error response");
        
        var exp = new ProxyClientException(errorResponse.Title)
        {
          ErrorResponse = errorResponse
        };

        LogError(exp);

        throw exp;
      }

      return resp.Content;
    }
    

    private async Task<TResp> Get<TResp>(string path, NodeCredentials credentials, CancellationToken ct = default)
    {
      var resp = await Request(path, null, HttpMethod.Get, credentials, ct);
      return await resp.ReadFromJsonAsync<TResp>(cancellationToken: ct) ?? throw new InvalidOperationException("Could not parse response from proxy call");
    }

    private async Task<TResp> GetDocker<TResp>(string path, NodeCredentials credentials, CancellationToken ct = default)
    {
      var resp = await Request(path, null, HttpMethod.Get, credentials, ct);
      var str = await resp.ReadAsStringAsync(cancellationToken: ct) ?? throw new InvalidOperationException("Could not parse response from proxy call");

      return dockerSerializer.DeserializeObject<TResp>(str);
    }

    private void LogError(ProxyClientException ex)
    {
      var currentActivity = Activity.Current;
      connectionLog.Error(
        currentActivity != null && ex.ErrorResponse != null ? $"{currentActivity.DisplayName} failed" : ex.Message,
        ex,
        ex.ErrorResponse != null ? new Dictionary<string, dynamic>(
          new[]
          {
            new KeyValuePair<string, dynamic>("detail", ex.ErrorResponse.Detail)
          }) : null
      );

      currentActivity?.AddEvent(new ActivityEvent("Request failed", tags: new ActivityTagsCollection
      {
        ["detail"] = ex.ErrorResponse?.Detail,
        ["title"] = ex.ErrorResponse?.Title,
        ["type"] = ex.ErrorResponse?.Type
      }));
    }

    private async IAsyncEnumerable<TResp> GetDockerSSE<TResp>(string path, NodeCredentials credentials, [EnumeratorCancellation] CancellationToken ct = 
    default) where TResp : class
    {
      using var client = ClientFor(credentials);
      using var reader = new StreamReader(await client.GetStreamAsync(path, ct));
      
      while (!ct.IsCancellationRequested)
      {
        var line = await reader.ReadLineAsync();

        if (!string.IsNullOrEmpty(line) && line.StartsWith("data: "))
        {
          line = line[6..];
        }
        
        switch (string.IsNullOrEmpty(line))
        {
          case false when dockerSerializer.TryDeserializeObject<TResp>(line, out var item):
            yield return item;
            break;
          case false when dockerSerializer.TryDeserializeObject<ProxyClientErrorResponse>(line, out var err):
          {
            var exp = new ProxyClientException(err.Title)
            {
              ErrorResponse = err
            };
            
            LogError(exp);

            throw exp;
          }
          case false:
            logger.LogDebug("{Line}", line);
            throw new InvalidOperationException("Could not parse SSE line");
        }
      }
    }


    private async Task<TResp> Post<TResp>(string path, object body, NodeCredentials credentials, CancellationToken ct = default)
    {
      var resp = await Request(path, body, HttpMethod.Post, credentials, ct);
      return await resp.ReadFromJsonAsync<TResp>(cancellationToken: ct) ?? throw new InvalidOperationException("Could not parse response from proxy call");
    }

    private async Task Post(string path, object? body, NodeCredentials credentials, CancellationToken ct = default)
    {
      await Request(path, body, HttpMethod.Post, credentials, ct);
    }

    public async Task WriteFile(NodeCredentials credentials, string path, byte[] contents, bool createFolder, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.WriteFile");
      activity?.AddTag("proxy.path", path);
      activity?.AddTag("proxy.create_folder", createFolder);

      connectionLog.Info($"Writing file '{path}'");
      
      await Post($"/files/write", new {path, contents, create_folder = createFolder}, credentials, ct);
    } 

    public record FileResponse(byte[] Contents, DateTime ModTime, long Size);

    public async Task<FileResponse> ReadFile(NodeCredentials credentials, string path, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.ReadFile");
      activity?.AddTag("proxy.path", path);

      connectionLog.Info($"Reading file '{path}'");

      return await Get<FileResponse>($"/files/read?path={HttpUtility.UrlEncode(path)}", credentials, ct);
    }

    public record UpsertFileResponse(bool Updated);
    
    public async Task<UpsertFileResponse> UpsertFile(NodeCredentials credentials, string path, byte[] contents, bool createFolder, CancellationToken ct = 
    default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.UpsertFile");
      activity?.AddTag("proxy.path", path);
      activity?.AddTag("proxy.create_folder", createFolder);

      connectionLog.Info($"Updating file '{path}'");
      
      return await Post<UpsertFileResponse>($"/files/upsert", new {path, contents, create_folder = createFolder}, credentials, ct);
    }

    public Task<UpsertFileResponse> UpsertFile(NodeCredentials credentials, string path, string contents, bool createFolder, CancellationToken ct = default)
      => UpsertFile(credentials, path, Encoding.UTF8.GetBytes(contents), createFolder, ct);


    public record DeleteFileResponse(bool Deleted);
    
    public async Task<bool> DeleteFile(NodeCredentials credentials, string path, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.DeleteFile");
      activity?.AddTag("proxy.path", path);

      connectionLog.Info($"Deleting file '{path}'");
      
      var resp = await Post<DeleteFileResponse>($"/files/delete?path={HttpUtility.UrlEncode(path)}", null, credentials, ct);

      return resp.Deleted;
    }

    public record RunCommandResponse(string Command, byte[]? Stdout, byte[]? Stderr, int? Code, string? Error);

    public async Task<RunCommandResponse> RunCommand(NodeCredentials credentials, string command, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.RunCommand");
      activity?.AddTag("proxy.path", command);

      connectionLog.Info($"Running command '{command}'");
      
      return await Get<RunCommandResponse>($"/command?command={HttpUtility.UrlEncode(command)}", credentials, ct);
    }

    public record SystemdGetServiceResponse(
      string Title,
      string Description,
      string Path,
      bool IsEnabled,
      bool IsActive,
      bool IsRunning,
      bool IsFailed,
      bool IsLoading,
      string LoadState,
      string ActiveState,
      string SubState
    );

    public async Task<SystemdGetServiceResponse> SystemdGetService(NodeCredentials credentials, string id, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.SystemdGetService");
      activity?.AddTag("proxy.id", id);

      connectionLog.Info($"Getting status of systemd service '{id}'");

      return await Get<SystemdGetServiceResponse>($"/systemd/service?id={HttpUtility.UrlEncode(id)}", credentials, ct);
    }

    public async Task SystemdStartService(NodeCredentials credentials, string id, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.SystemdStartService");
      activity?.AddTag("proxy.id", id);

      connectionLog.Info($"Starting systemd service '{id}'");
      
      await Post($"/systemd/service/start?id={HttpUtility.UrlEncode(id)}", null, credentials, ct);
    }

    public async Task SystemdStopService(NodeCredentials credentials, string id, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.SystemdStopService");
      activity?.AddTag("proxy.id", id);

      connectionLog.Info($"Stopping systemd service '{id}'");
      
      await Post($"/systemd/service/stop?id={HttpUtility.UrlEncode(id)}", null, credentials, ct);
    }

    public async Task SystemdEnableService(NodeCredentials credentials, string id, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.SystemdEnableService");
      activity?.AddTag("proxy.id", id);

      connectionLog.Info($"Enabling systemd service '{id}'");
      
      await Post($"/systemd/service/enable?id={HttpUtility.UrlEncode(id)}", null, credentials, ct);
    }

    public async Task SystemdDisableService(NodeCredentials credentials, string id, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.SystemdDisableService");
      activity?.AddTag("proxy.id", id);

      connectionLog.Info($"Disabling systemd service '{id}'");

      await Post($"/systemd/service/disable?id={HttpUtility.UrlEncode(id)}", null, credentials, ct);
    }

    public async Task SystemdRestartService(NodeCredentials credentials, string id, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.SystemdRestartService");
      activity?.AddTag("proxy.id", id);

      connectionLog.Info($"Restarting systemd service '{id}'");
      
      await Post($"/systemd/service/restart?id={HttpUtility.UrlEncode(id)}", null, credentials, ct);
    }

    public async Task SystemdReload(NodeCredentials credentials, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.SystemdReload");

      connectionLog.Info($"Reloading systemd");
      
      await Post($"/systemd/reload", null, credentials, ct);
    }

    public async Task<ContainerListResponse[]> ListContainers(NodeCredentials credentials, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.ListContainers");

      connectionLog.Info($"Reading docker containers");

      return await GetDocker<ContainerListResponse[]>($"/docker/containers/json", credentials, ct);
    }

    public async Task<ContainerInspectResponse> InspectContainer(NodeCredentials credentials, string id, CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.InspectContainer");
      activity?.AddTag("supercompose.containerId", id);

      return await GetDocker<ContainerInspectResponse>($"/docker/containers/{id}/json", credentials, ct);
    }

    public async IAsyncEnumerable<Message> DockerEvents(NodeCredentials credentials, [EnumeratorCancellation] CancellationToken ct = default)
    {
      using var activity = Extensions.SuperComposeActivitySource.StartActivity("ProxyClient.DockerEvents");

      var sseEvents = GetDockerSSE<Message>($"/docker/events", credentials, ct);

      await foreach (var item in sseEvents.WithCancellation(ct))
      {
        activity?.AddEvent(
          new ActivityEvent(
            "Received event",
            tags: new ActivityTagsCollection(new[]
            {
              new KeyValuePair<string, object?>("action", item.Action),
              new KeyValuePair<string, object?>("actor", item.Actor),
              new KeyValuePair<string, object?>("id", item.ID),
              new KeyValuePair<string, object?>("type", item.Type),
              new KeyValuePair<string, object?>("status", item.Status),
            })
            )
          );
        
        yield return item;
      }
    }
  }
}