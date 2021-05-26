using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace SuperCompose.Util
{
  /// <summary>
  /// From https://github.com/dotnet/Docker.DotNet
  /// </summary>
  public class DockerJsonSerializer
  {
      private readonly Newtonsoft.Json.JsonSerializer _serializer;

      private readonly JsonSerializerSettings _settings = new JsonSerializerSettings
      {
        NullValueHandling = NullValueHandling.Ignore,
        Converters = new JsonConverter[]
        {
          new JsonIso8601AndUnixEpochDateConverter(),
          new JsonVersionConverter(),
          new StringEnumConverter(),
          new TimeSpanSecondsConverter(),
          new TimeSpanNanosecondsConverter(),
          new JsonBase64Converter()
        }
      };

      public DockerJsonSerializer()
      {
        _serializer = Newtonsoft.Json.JsonSerializer.CreateDefault(this._settings);
      }

      public Task<T> Deserialize<T>(JsonReader jsonReader, CancellationToken cancellationToken)
      {
        var tcs = new TaskCompletionSource<T>();
        using (cancellationToken.Register(() => tcs.TrySetCanceled(cancellationToken)))
        {
          Task.Factory.StartNew(
            () => tcs.TrySetResult(_serializer.Deserialize<T>(jsonReader)),
            cancellationToken,
            TaskCreationOptions.LongRunning,
            TaskScheduler.Default
          );

          return tcs.Task;
        }
      }

      public T DeserializeObject<T>(string json)
      {
        return JsonConvert.DeserializeObject<T>(json, this._settings);
      }

      public string SerializeObject<T>(T value)
      {
        return JsonConvert.SerializeObject(value, this._settings);
      }
  }
}