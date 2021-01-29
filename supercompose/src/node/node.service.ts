import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuthDefinition, AuthConfigEntity } from './authConfig.entity';
import { NodeEntity } from './node.entity';
import { uuid } from 'uuidv4';
import { NodeConfigEntity } from './nodeConfig.entity';

@Injectable()
export class NodeService {
  constructor(
    @InjectRepository(NodeEntity)
    private readonly nodeRepo: Repository<NodeEntity>,
    @InjectEntityManager()
    private readonly manager: EntityManager,
  ) {}

  public async createNode(name: string, auth: AuthDefinition) {
    const authEntity = new AuthConfigEntity();
    authEntity.id = uuid();
    authEntity.host = auth.host;
    authEntity.username = auth.username;
    authEntity.port = auth.port;
    authEntity.password = auth.password;
    authEntity.privateKey = auth.privateKey;

    const nodeConfigEntity = new NodeConfigEntity();
    nodeConfigEntity.id = uuid();
    nodeConfigEntity.auth = authEntity;

    const nodeEntity = new NodeEntity();
    nodeEntity.id = uuid();
    nodeEntity.name = name;
    nodeEntity.targetConfig = nodeConfigEntity;

    await this.manager.transaction(async trx => {
      await trx.save(authEntity);
      await trx.save(nodeConfigEntity);
      await trx.save(nodeEntity);
    });

    return nodeEntity.id;
  }
}
