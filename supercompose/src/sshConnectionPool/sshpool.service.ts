import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Scope,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NodeConfig } from 'src/node/nodeConfig.entity';
import { SuperComposeNodeEntity } from 'src/node/SuperComposeNode.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { NodeConnectionManager } from './nodeConnectionManager';

// @Injectable({ scope: Scope.DEFAULT })
@Injectable()
export class SSHPoolService implements OnModuleInit, OnModuleDestroy {
  private nodes?: SuperComposeNodeEntity[];
  private connections: Record<string, NodeConnectionManager> = {};

  constructor(
    @InjectRepository(NodeConfig)
    private readonly nodeConfigRepo: Repository<NodeConfig>,
    @InjectRepository(SuperComposeNodeEntity)
    private readonly nodeRepo: Repository<SuperComposeNodeEntity>,
  ) {}

  public async onModuleInit() {
    this.nodes = await this.nodeRepo.find({
      where: { targetConfig: Not(IsNull()) },
      relations: ['targetConfig'],
    });

    for (const node of this.nodes) {
      const conn = (this.connections[node.id] = new NodeConnectionManager(
        node.targetConfig.id,
        this.nodeConfigRepo,
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
