import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Scope,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CryptoService } from 'src/crypto/crypto.service';
import { NodeEntity } from 'src/node/node.entity';
import { Repository } from 'typeorm';
import { NodeConnectionManager } from './nodeConnectionManager';

@Injectable({ scope: Scope.DEFAULT })
export class SSHPoolService implements OnModuleInit, OnModuleDestroy {
  private nodes?: NodeEntity[];
  private connections: Record<string, NodeConnectionManager> = {};

  constructor(
    @InjectRepository(NodeEntity)
    private readonly nodeRepo: Repository<NodeEntity>,
    private readonly crypto: CryptoService,
  ) {}

  public async onModuleInit() {
    this.nodes = await this.nodeRepo.find({
      where: { enabled: true },
    });

    for (const node of this.nodes) {
      const conn = (this.connections[node.id] = new NodeConnectionManager(
        node.id,
        this.nodeRepo,
        this.crypto,
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
