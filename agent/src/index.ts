import { Client, ClientChannel, ConnectConfig, Connection } from "ssh2";
import { interpret, Machine, sendParent, assign } from "xstate";
import { fromEvent, Observable } from "rxjs";
import { map, mergeMap, take } from "rxjs/operators";
import EventEmitter from "events";

type NodeConnectionState =
  | "pending"
  | "connecting"
  | "closed"
  | "ready"
  | "executing";

class NodeConnection extends EventEmitter {
  public state: NodeConnectionState = "pending";
  private client?: Client;

  constructor(private id: string, private credentials: ConnectConfig) {
    super({});
  }

  private setState(state: NodeConnectionState) {
    this.state = state;
    console.debug("NodeConnection", this.id, "is updating state to", state);
    this.emit("stateChange", state);
  }

  public async connect() {
    if (this.state !== "pending" && this.state !== "closed") {
      throw new Error(`Cannot connect while in state ${this.state}`);
    }

    console.info(
      "NodeConnection",
      this.id,
      "connecting to",
      `${this.credentials.username}@${this.credentials.host}:${this.credentials.port}`
    );

    this.setState("connecting");
    this.client = new Client();

    this.client.on("close", (withError) => {
      console.info(
        "NodeConnection",
        this.id,
        "closed",
        withError ? "with error" : ""
      );
      this.setState("closed");
    });

    await new Promise<void>((resolve, reject) => {
      const errorListener = (err: Error) => {
        console.error(
          "Error in NodeConnection",
          this.id,
          "while connecting",
          err
        );

        return reject(err);
      };

      this.client?.once("error", errorListener);
      this.client?.once("ready", () => {
        resolve();
        this.client?.removeListener("error", errorListener);
      });

      this.client?.once("close", () =>
        errorListener(new Error("Closed while connecting"))
      );

      this.client!.connect(this.credentials);
    });

    this.client.on("error", (err) => {
      console.error("NodeConnection", this.id, "error", err);
    });

    this.setState("ready");
  }

  public async runCommand(
    cmd: string
  ): Promise<{
    code: number;
    signal: string;
    stdout: string;
    stderr: string;
  }> {
    if (this.state !== "ready") {
      throw new Error(
        `NodeConnection ${this.id} cannot run command while in state ${this.state}`
      );
    }

    this.setState("executing");
    console.info("NodeConnection", this.id, "running command", cmd);

    try {
      return await new Promise(async (resolve, reject) => {
        const run = () =>
          this.client!.exec(cmd, (err, channel) => {
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
                  stdout: stdout.map((x) => x.toString("utf-8")).join(""),
                  stderr: stderr.map((x) => x.toString("utf-8")).join(""),
                });
              })
              .on("data", function (data: any) {
                stdout.push(data);
              })
              .stderr.on("data", function (data) {
                stderr.push(data);
              });
          });

        while (!run()) {
          console.info(
            "NodeConnection",
            this.id,
            "waiting for continue to run command",
            cmd
          );
          await new Promise((resolve) =>
            this.client?.once("continue", resolve)
          );
        }
      });
    } catch (ex) {
      console.error("Error while executing command", ex);
      throw ex;
    } finally {
      this.setState("ready");
    }
  }

  public async close() {
    if (
      this.state === "connecting" ||
      this.state === "executing" ||
      this.state === "ready"
    ) {
      console.info("Disconnecting", this.id);
      this.client?.end();
    }
  }
}

class DB {
  async getEnabledNodes() {
    return [
      {
        id: "e35e3427-a80c-475c-9011-8cf606d5d636",
        auth: {
          host: "localhost",
          port: 2222,
          username: "username",
          password: "password",
          // privateKey: require("fs").readFileSync("/here/is/my/key"),
        },
      },
    ];
  }

  async getNode(id: string) {
    return {
      id: "e35e3427-a80c-475c-9011-8cf606d5d636",
      auth: {
        host: "localhost",
        port: 2222,
        username: "username",
        password: "password",
        // privateKey: require("fs").readFileSync("/here/is/my/key"),
      },
    };
  }
}

type Unwrap<T> = T extends Promise<infer U>
  ? U
  : T extends (...args: any) => Promise<infer U>
  ? U
  : T extends (...args: any) => infer U
  ? U
  : T;

class NodeConnectionManager {
  private node?: Unwrap<ReturnType<DB["getEnabledNodes"]>>[0];
  private connection?: NodeConnection;
  private shouldBeRunning = true;
  private nodeEvents = new EventEmitter();
  private maintainingPromise?: Promise<void>;

  constructor(private id: string, private db: DB) {}

  private async maintainConnection() {
    try {
      while (this.shouldBeRunning) {
        console.warn("Connecting");
        let connectionDelay = 100;

        if (this.connection) {
          this.connection.close();
          this.connection.removeAllListeners("stateChange");
        }

        this.connection = new NodeConnection(this.id, this.node!.auth);
        this.connection.on("stateChange", (state) =>
          this.nodeEvents.emit(state)
        );

        while (this.shouldBeRunning) {
          try {
            await this.connection!.connect();

            break;
          } catch (ex) {
            console.info(
              "Could not connect to node",
              this.id,
              "because",
              ex.message,
              "waiting for",
              connectionDelay
            );
            await new Promise((resolve) =>
              setTimeout(resolve, connectionDelay)
            );
            connectionDelay = Math.min(connectionDelay * 2, 10 * 60 * 1000);
          }
        }

        if (!this.shouldBeRunning) {
          break;
        }

        await new Promise((resolve) => this.nodeEvents.once("closed", resolve));
        console.info(
          "Underlying connection for",
          this.id,
          "closed, reconnecting"
        );
      }
    } catch (ex) {
      console.error("Error while maintaining", this.id, ex);
    }
  }

  public async start() {
    this.node = await this.db.getNode(this.id);
    this.maintainingPromise = this.maintainConnection();
  }

  public async stop() {
    this.shouldBeRunning = false;
  }

  public async runCommand(cmd: string) {
    if (!this.connection) {
      throw new Error(
        `Connection ${this.id} not running while attempting to run command ${cmd}`
      );
    }

    if (this.connection.state !== "ready") {
      console.info(
        "Connection",
        this.id,
        "is waiting for internal ready state before running command"
      );
      await new Promise((resolve) => this.nodeEvents.once("ready", resolve));
    }

    try {
      return this.connection.runCommand(cmd);
    } catch (ex) {
      console.error("Error while executing command", ex);
      throw ex;
    }
  }
}

class NodeManager {
  private nodes?: Unwrap<ReturnType<DB["getEnabledNodes"]>>;
  private connections: Record<string, NodeConnectionManager> = {};

  constructor(private db: DB) {}

  public async start() {
    this.nodes = await this.db.getEnabledNodes();

    for (const node of this.nodes) {
      const conn = (this.connections[node.id] = new NodeConnectionManager(
        node.id,
        this.db
      ));

      await conn.start();
    }
  }

  public async stop() {
    for (const conn of Object.values(this.connections)) {
      await conn.stop();
    }
  }

  public async runCommandOn(nodeId: string, cmd: string) {
    return this.connections[nodeId].runCommand(cmd);
  }
}

async function main() {
  const db = new DB();
  const mgr = new NodeManager(db);
  await mgr.start();

  process.once("SIGINT", async () => {
    return mgr.stop();
  });

  while (true) {
    try {
      const resp = await mgr.runCommandOn(
        "e35e3427-a80c-475c-9011-8cf606d5d636",
        "uptime"
      );
      console.warn(resp.stdout);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (ex) {
      console.error("Exception in main loop", ex);
    }
  }
}

process.on("SIGINT", function () {
  console.log("SIGINT");
});

process.on("SIGKILL", function () {
  console.log("SIGKILL");
});

process
  .on("unhandledRejection", (reason, p) => {
    console.error(reason, "Unhandled Rejection at Promise", p);
  })
  .on("uncaughtException", (err) => {
    console.error(err, "Uncaught Exception thrown");
    process.exit(1);
  });

main()
  .then(() => {
    console.info("All done");
  })
  .catch((ex) => {
    console.error("Fatal", ex);
    process.exit(1);
  });
