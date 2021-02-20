import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ComposeEntity } from 'compose/compose.entity';
import { NodeEntity } from 'node/node.entity';
import { EntityManager, Repository } from 'typeorm';
import { v4 } from 'uuid';
import { DeploymentEntity } from './deployment.entity';

@Injectable()
export class DeploymentService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,
    @InjectRepository(DeploymentEntity)
    private readonly deploymentRepo: Repository<DeploymentEntity>,
    @InjectRepository(ComposeEntity)
    private readonly composeRepo: Repository<ComposeEntity>,
  ) {}

  public async deploy(args: { compose: string; node: string }) {
    return await this.manager.transaction(async trx => {
      const compose = await trx.findOne(ComposeEntity, args.compose);
      if (!compose) {
        throw new Error(`Could not find compose ${args.compose}`);
      }

      const node = await trx.findOne(NodeEntity, args.node);
      if (!node) {
        throw new Error(`Could not find node ${args.node}`);
      }

      const deployment = new DeploymentEntity();
      deployment.id = v4();
      deployment.enabled = true;
      deployment.compose = Promise.resolve(compose);
      deployment.node = Promise.resolve(node);

      await trx.save(deployment);

      return deployment.id;
    });
  }
}
