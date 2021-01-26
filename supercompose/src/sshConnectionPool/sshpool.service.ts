import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Scope,
} from '@nestjs/common';
import { DB, NodeConfig } from './db.service';
import { NodeConnectionManager } from './nodeConnectionManager';
import { Unwrap } from './types';

@Injectable({ scope: Scope.DEFAULT })
export class SSHPoolService implements OnModuleInit, OnModuleDestroy {
  private nodes?: Unwrap<NodeConfig[]>;
  private connections: Record<string, NodeConnectionManager> = {};

  constructor(private db: DB) {}

  public async onModuleInit() {
    this.nodes = await this.db.getNodes();

    for (const node of this.nodes) {
      const conn = (this.connections[node.id] = new NodeConnectionManager(
        node.id,
        this.db,
      ));

      await conn.start();
    }
  }

  public async onModuleDestroy() {
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
    opts: { recursive?: boolean } = {},
  ) {
    return this.connections[nodeId].writeFile(path, content, opts);
  }
}
