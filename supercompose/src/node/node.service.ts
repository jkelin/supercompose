import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthDefinition, NodeAuthConfigEntity } from './nodeAuthConfing.entity';
import { SuperComposeNodeEntity } from './SuperComposeNode.entity';
import { uuid } from 'uuidv4';
import { NodeConfigEntity } from './nodeConfig.entity';

@Injectable()
export class NodeService {
  constructor(
    @InjectRepository(SuperComposeNodeEntity)
    private readonly nodeRepo: Repository<SuperComposeNodeEntity>,
  ) {}

  public async createNode(name: string, auth: AuthDefinition) {
    const authEntity = new NodeAuthConfigEntity();
    authEntity.id = uuid();
    authEntity.host = auth.host;
    authEntity.username = auth.username;
    authEntity.port = auth.port;
    authEntity.password = auth.password;
    authEntity.privateKey = auth.privateKey;

    const nodeConfigEntity = new NodeConfigEntity();
    nodeConfigEntity.id = uuid();
    nodeConfigEntity.auth = authEntity;

    const nodeEntity = new SuperComposeNodeEntity();
    nodeEntity.id = uuid();
    nodeEntity.name = name;
    nodeEntity.targetConfig = nodeConfigEntity;

    this.nodeRepo.save(nodeEntity);

    return nodeEntity.id;
  }
}
