import { Client, ConnectConfig } from "ssh2";
import { interpret, Machine, sendParent, assign } from "xstate";
import { fromEvent } from "rxjs";
import { map, take } from "rxjs/operators";

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

const connectionMachine = Machine({
  context: {
    client: new Client(),
  },
  invoke: [
    {
      src: (context, event) =>
        fromEvent(context.client, "error").pipe(
          map((error) => ({ type: "ERROR", error }))
        ),
    },
    {
      src: (context, event) =>
        fromEvent(context.client, "ready").pipe(map(() => "READY")),
    },
  ],
  on: {
    ERROR: "failed",
  },
  initial: "created",
  states: {
    created: {
      on: {
        CONNECT: {
          target: "connecting",
          actions: (ctx: any, event: any) =>
            (ctx.client as Client).connect(event.config),
        },
      },
    },
    connecting: {
      on: {
        READY: "connected",
      },
    },
    connected: {
      initial: "ready",
      states: {
        ready: {
          on: {
            EXECUTE: {
              target: "executing",
            },
          },
        },
        executing: {
          invoke: {
            src: (ctx: any, event: any) =>
              runCommand(ctx.client, event.command),
            onDone: {
              actions: (ctx: any, event: any) =>
                sendParent({ type: "COMMAND_COMPLETED", data: event.data }),
              target: "ready",
            },
            onError: {
              actions: (ctx: any, event: any) =>
                sendParent({ type: "COMMAND_ERROR", error: event.data }),
              target: "ready",
            },
          },
        },
      },
    },
    failed: {
      entry: [
        (ctx: any, event: any) =>
          sendParent({ type: "CONNECTION_FAILED", data: event.data }),
        assign({ client: new Client() }),
      ],
      always: "created",
    },
  },
});

// class Connection {
//   private state = interpret(connectionMachine)

//   constructor() {
//     this.state.state.context.client.on()
//   }

//   public async connect(cfg: ConnectConfig): Promise<unknown> {

// {
//     host: "localhost",
//     port: 2222,
//     username: "username",
//     password: "password",
//     // privateKey: require("fs").readFileSync("/here/is/my/key"),
//   }
//   }
// }

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
