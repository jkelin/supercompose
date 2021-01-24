import { DB } from "./db";
import { NodeConnectionManager } from "./nodeConnectionManager";
import { Unwrap } from "./types";

export class NodeManager {
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
