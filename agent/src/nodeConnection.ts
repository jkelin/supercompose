import { Client, ConnectConfig } from "ssh2";
import EventEmitter from "events";

type NodeConnectionState =
  | "pending"
  | "connecting"
  | "closed"
  | "ready"
  | "executing";

export class NodeConnection extends EventEmitter {
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
