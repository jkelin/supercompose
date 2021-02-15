import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ComposeEntity } from 'src/compose/compose.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class DeploymentService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,
    @InjectRepository(ComposeEntity)
    private readonly composeRepo: Repository<ComposeEntity>,
  ) {}

  public async deploy(args: { compose: string; node: string }) {
    console.warn(args.compose, args.node);
  }
}
