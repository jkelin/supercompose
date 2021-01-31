import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ComposeModel } from './compose.model';
import { DeploymentEntity } from './deployment.entity';
import { DeploymentModel } from './deployment.model';
import { NodeModel } from './node.model';

@Resolver(() => DeploymentModel)
export class DeploymentResolver {
  @ResolveField(() => Boolean)
  async enabled(@Parent() self: DeploymentEntity) {
    return self.enabled;
  }

  @ResolveField(() => ComposeModel)
  async compose(@Parent() self: DeploymentEntity) {
    return self.compose;
  }

  @ResolveField(() => NodeModel)
  async node(@Parent() self: DeploymentEntity) {
    return self.node;
  }
}
