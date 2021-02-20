import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { NodeModel } from 'node/node.model';
import { Repository } from 'typeorm';
import { DeploymentEntity } from './deployment.entity';
import { DeploymentModel } from './deployment.model';
import { DeploymentService } from './deployment.service';

@Resolver(() => DeploymentModel)
export class DeploymentResolver {
  @InjectRepository(DeploymentEntity)
  private readonly deploymentRepo: Repository<DeploymentEntity>;

  constructor(private readonly deploymentService: DeploymentService) {}

  @Mutation(() => DeploymentModel)
  async createDeployment(
    @Args('compose', { type: () => ID }) compose: string,
    @Args('node', { type: () => ID }) node: string,
  ) {
    const id = await this.deploymentService.deploy({ compose, node });

    return this.deploymentRepo.findOne({
      where: { id: id },
      relations: ['node', 'compose'],
    });
  }

  @Query(() => [DeploymentModel])
  async deployments() {
    return this.deploymentRepo.find({
      relations: ['node', 'compose'],
    });
  }

  @Query(() => DeploymentModel)
  async deployment(@Args('id', { type: () => ID }) id: string) {
    return this.deploymentRepo.findOne({
      where: {
        id: id,
      },
      relations: ['node', 'compose'],
    });
  }

  @ResolveField()
  async enabled(@Parent() self: DeploymentEntity) {
    return self.enabled;
  }

  @ResolveField()
  async compose(@Parent() self: DeploymentEntity) {
    return self.compose;
  }

  @ResolveField()
  async node(@Parent() self: DeploymentEntity) {
    return self.node;
  }
}
