import {
  Args,
  ID,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComposeEntity } from './compose.entity';
import { ComposeModel } from './compose.model';
import { ComposeVersionEntity } from './composeVersion.entity';
import { DeploymentModel } from './deployment.model';

@Resolver(() => ComposeModel)
export class ComposeResolver {
  @InjectRepository(ComposeVersionEntity)
  private readonly composeRepo: Repository<ComposeVersionEntity>;

  @Query(() => ComposeModel)
  async compose(@Args('id', { type: () => ID }) id: string) {
    return this.composeRepo.findOne({
      where: { id },
      relations: ['current', 'deployments', 'deployments.node'],
    });
  }

  @Query(() => [ComposeModel])
  async composes() {
    return this.composeRepo.find({
      relations: ['current', 'deployments', 'deployments.node'],
    });
  }

  @ResolveField(() => String)
  async name(@Parent() self: ComposeEntity) {
    return self.name;
  }

  @ResolveField(() => String)
  async content(@Parent() self: ComposeEntity) {
    return self.current.content;
  }

  @ResolveField(() => Boolean)
  async serviceEnabled(@Parent() self: ComposeEntity) {
    return self.current.serviceEnabled;
  }

  @ResolveField(() => String, { nullable: true })
  async serviceName(@Parent() self: ComposeEntity) {
    return self.current.serviceName;
  }

  @ResolveField(() => [DeploymentModel], { nullable: true })
  async deployments(@Parent() self: ComposeEntity) {
    return self.deployments;
  }
}
