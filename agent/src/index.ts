import { Client, ClientChannel, ConnectConfig, Connection } from "ssh2";
import { interpret, Machine, sendParent, assign } from "xstate";
import { fromEvent, Observable } from "rxjs";
import { map, mergeMap, take } from "rxjs/operators";

function runCommand(
  client: Client,
  command: string
): Promise<{
  code: number;
  signal: string;
  stdout: Buffer[];
  stderr: Buffer[];
}> {
  return new Promise((resolve, reject) => {
    client.exec(command, (err, channel) => {
      if (err) {
        return reject(err);
      }

      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];

      channel
        .on("close", function (code: any, signal: any) {
          resolve({
            code,
            signal,
            stdout,
            stderr,
          });
        })
        .on("data", function (data: any) {
          stdout.push(data);
        })
        .stderr.on("data", function (data) {
          stderr.push(data);
        });
    });
  });
}

// const connectionMachine = Machine({
//   context: {
//     client: new Client(),
//   },
//   invoke: [
//     {
//       src: (context, event) =>
//         fromEvent(context.client, "error").pipe(
//           map((error) => ({ type: "ERROR", error }))
//         ),
//     },
//     {
//       src: (context, event) =>
//         fromEvent(context.client, "ready").pipe(map(() => "READY")),
//     },
//   ],
//   on: {
//     ERROR: "failed",
//   },
//   initial: "created",
//   states: {
//     created: {
//       on: {
//         CONNECT: {
//           target: "connecting",
//           actions: (ctx: any, event: any) =>
//             (ctx.client as Client).connect(event.config),
//         },
//       },
//     },
//     connecting: {
//       on: {
//         READY: "connected",
//       },
//     },
//     connected: {
//       initial: "ready",
//       states: {
//         ready: {
//           on: {
//             EXECUTE: {
//               target: "executing",
//             },
//           },
//         },
//         executing: {
//           invoke: {
//             src: (ctx: any, event: any) =>
//               runCommand(ctx.client, event.command),
//             onDone: {
//               actions: (ctx: any, event: any) =>
//                 sendParent({ type: "COMMAND_COMPLETED", data: event.data }),
//               target: "ready",
//             },
//             onError: {
//               actions: (ctx: any, event: any) =>
//                 sendParent({ type: "COMMAND_ERROR", error: event.data }),
//               target: "ready",
//             },
//           },
//         },
//       },
//     },
//     failed: {
//       entry: [
//         (ctx: any, event: any) =>
//           sendParent({ type: "CONNECTION_FAILED", data: event.data }),
//         assign({ client: new Client() }),
//       ],
//       always: "created",
//     },
//   },
// });

// // class Connection {
// //   private state = interpret(connectionMachine)

// //   constructor() {
// //     this.state.state.context.client.on()
// //   }

// //   public async connect(cfg: ConnectConfig): Promise<unknown> {

// // {
// //     host: "localhost",
// //     port: 2222,
// //     username: "username",
// //     password: "password",
// //     // privateKey: require("fs").readFileSync("/here/is/my/key"),
// //   }
// //   }
// // }

// class NodeConnection {
//   private state:
//     | "starting"
//     | "connecting"
//     | "ready"
//     | "awaitingStream"
//     | "executing" = "starting";
//   private client?: Client;
//   private nodeMeta?: any;

//   constructor(private id: string, private db: any) {}

//   private async readNodeMetadata() {}

//   private onClientReady = () => {
//     this.tick()
//   };

//   private onClientError = (err: Error) => {};

//   private onClientClose = () => {};
//   private onStream = (err: Error | undefined, stream: ClientChannel) => {};
//   private onStreamStdOut = (data: Buffer) => {};
//   private onStreamErr = (data: Buffer) => {};
//   private onStreamClose = () => {};

//   private async connect() {
//     this.client = new Client();

//     this.client.on("ready", this.onClientReady);
//     this.client.on("error", this.onClientReady);
//     this.client.on("close", this.onClientReady);

//     this.client.connect({
//       host: this.nodeMeta!.credentials.host,
//       port: this.nodeMeta!.credentials.port,
//       username: this.nodeMeta!.credentials.username,
//       password: this.nodeMeta!.credentials.password,
//       // privateKey: require("fs").readFileSync("/here/is/my/key"),
//     });
//   }

//   private async runCommand(command: string) {
//     this.client?.exec(command, this.onStream)

//     const stream = await new Promise((resolve, reject) => {
//       conn.exec("uptime", function (err, stream) {
//         if (err) return reject(err);

//         resolve(stream);
//       });
//     });

//     stream
//       .on("close", function (code: any, signal: any) {
//         console.log("Stream :: close :: code: " + code + ", signal: " + signal);
//         conn.end();
//       })
//       .on("data", function (data: any) {
//         console.log("STDOUT: " + data);
//       })
//       .stderr.on("data", function (data) {
//         console.log("STDERR: " + data);
//       });
//   }

//   private tick() {}

//   public async run() {
//     while (true) {
//       if (this.state === "starting") {
//         await this.readNodeMetadata();
//         this.state = "connecting";
//       } else if (this.state === "connecting") {
//         await this.connect();
//       }
//     }
//   }
// }

function run($commands: Observable<string>) {
  const conn = new Client();
  const $connReady = fromEvent(conn, "ready");
  const $connError = fromEvent(conn, "error");

  const $commandExecutions = $connReady.pipe(
    mergeMap(() => {
      return $commands.pipe(
        map((cmd) => {
          return new Observable((subscriber) => {
            conn.exec(cmd, function (err, chan) {
              if (err) return subscriber.error(err);

              chan
                .on("close", function (code: any, signal: any) {
                  subscriber.complete();
                })
                .on("data", function (data: any) {
                  subscriber.next({ type: "stdout", data });
                })
                .stderr.on("data", function (data) {
                  subscriber.next({ type: "stderr", data });
                });
            });
          });
        })
      );
    })
  );

  conn.connect();
}

const conn = new Client();
conn
  .on("ready", function () {
    console.log("Client :: ready");
    conn.exec("uptime", function (err, stream) {
      if (err) throw err;
      stream
        .on("close", function (code: any, signal: any) {
          console.log(
            "Stream :: close :: code: " + code + ", signal: " + signal
          );
          conn.end();
        })
        .on("data", function (data: any) {
          console.log("STDOUT: " + data);
        })
        .stderr.on("data", function (data) {
          console.log("STDERR: " + data);
        });
    });
  })
  .on("error", (err) => {
    console.warn("Client failed with", err);
  })
  .connect({
    host: "localhost",
    port: 2222,
    username: "username",
    password: "password",
    // privateKey: require("fs").readFileSync("/here/is/my/key"),
  });
