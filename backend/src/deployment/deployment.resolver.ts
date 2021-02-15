import {
  Args,
  ID,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { DeploymentEntity } from './deployment.entity';
import { DeploymentModel } from './deployment.model';
import { DeploymentService } from './deployment.service';

@Resolver(() => DeploymentModel)
export class DeploymentResolver {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Mutation(() => DeploymentModel)
  async createDeployment(
    @Args('compose', { type: () => ID }) compose: string,
    @Args('node', { type: () => ID }) node: string,
  ) {
    await this.deploymentService.deploy({ compose, node });

    return true;
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
