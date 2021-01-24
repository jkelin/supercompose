import { DB } from "./db";
import { NodeConnection } from "./nodeConnection";
import { Unwrap } from "./types";
import EventEmitter from "events";

export class NodeConnectionManager {
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
