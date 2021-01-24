import { DB, NodeConfig } from "./db";
import { NodeConnectionManager } from "./nodeConnectionManager";
import { Unwrap } from "./types";

export class NodeManager {
  private nodes?: Unwrap<NodeConfig[]>;
  private connections: Record<string, NodeConnectionManager> = {};

  constructor(private db: DB) {}

  public async start() {
    this.nodes = await this.db.getNodes();

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

  public async fileExistsOn(nodeId: string, path: string) {
    return this.connections[nodeId].fileExists(path);
  }

  public async readFileOn(nodeId: string, path: string) {
    return this.connections[nodeId].readFile(path);
  }

  public async writeFileOn(
    nodeId: string,
    path: string,
    content: string,
    opts: { recursive?: boolean } = {}
  ) {
    return this.connections[nodeId].writeFile(path, content, opts);
  }
}
