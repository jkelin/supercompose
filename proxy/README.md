# Smart SSH proxy

Simple, stateful but persistence free SSH proxy and multiplexer. Exposes remote SSH server services through HTTP interface. Supports shell commands, SFTP and Docker.

It is intended for low latency and high reliability. Slowest part of SSH is opening the SSH connection itself and authenticating - issuing shell commands, making file operations or piping docker socket generally happens sub 100ms on open SSH connection.

API docs: https://documenter.getpostman.com/view/15868536/TzRa63fv#035ebbd4-9343-4c80-ad29-fb5919415d7d

#### Features

- HTTP API with compression
- Each request is authenticated with Json Web Tokens (JWT) containing SSH server credentials
- Only one SSH connection to each server is made. Connections are created on demand and disposed after few minutes of inactivity
- Single SSH connection can multiplex several shell/sftp/socket sessions
- Docker streaming APIs are re-exposed as Server Sent Events (SSE)
- File write operation uses `mv` instead of in-place overwrites, so that files are not inconsistently half written when connection fails

## TODO

- systemd unit management through DBUS
- Better logging
- Open Telemetry
- Docker socket reexported as-is
- Graceful shutdown (right now SSE just hangs)
- Extended profiling for memory leaks
- Better request cancellation and timeouts
- Persistent Docker system container state
  - We list and later inspect all system containers on connection open
  - We subscribe to docker events
  - On each event, we will reinspect relevant containers
  - Thus we can maintain persistent data model of docker containers in memory
  - And allow queries to this state without latency
  - And expose streaming API that synchronizes changes to this model through JSON Patch over Server Sent Events
- Expose all as GRPC API
