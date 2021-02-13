import {
  Args,
  Field,
  ID,
  InputType,
  Mutation,
  Parent,
  PartialType,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComposeEntity } from './compose.entity';
import { ComposeModel } from './compose.model';
import { ComposeVersionEntity } from 'src/compose/composeVersion.entity';
import { DeploymentModel } from 'src/deployment/deployment.model';
import { Matches } from 'class-validator';
import { ComposeService } from './compose.service';

@InputType()
export class ComposeInput {
  @Field()
  name: string;

  @Matches(/^(\/[^/ ]*)+\/?$/)
  @Field()
  directory: string;

  @Field()
  serviceEnabled: boolean;

  @Field()
  compose: string;
}

@Resolver(() => ComposeModel)
export class ComposeResolver {
  @InjectRepository(ComposeEntity)
  private readonly composeRepo: Repository<ComposeEntity>;

  constructor(private composeService: ComposeService) {}

  @Mutation(() => ComposeModel)
  async createCompose(@Args('compose') compose: ComposeInput) {
    const id = await this.composeService.create(compose);

    return this.composeRepo.findOne({
      where: { id },
      relations: ['current'],
    });
  }

  @Mutation(() => ComposeModel)
  async updateCompose(
    @Args('id', { type: () => ID }) id: string,
    @Args('compose') compose: ComposeInput,
  ) {
    await this.composeService.update(id, compose);

    return this.composeRepo.findOne({
      where: { id },
      relations: ['current'],
    });
  }

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
      relations: ['current'],
    });
  }

  @ResolveField(() => String)
  async name(@Parent() self: ComposeEntity) {
    return self.name;
  }

  @ResolveField(() => String)
  async content(@Parent() self: ComposeEntity) {
    return (await self.current).content;
  }

  @ResolveField(() => String)
  async directory(@Parent() self: ComposeEntity) {
    return (await self.current).directory;
  }

  @ResolveField(() => Boolean)
  async serviceEnabled(@Parent() self: ComposeEntity) {
    return (await self.current).serviceEnabled;
  }

  @ResolveField(() => String, { nullable: true })
  async serviceName(@Parent() self: ComposeEntity) {
    return (await self.current).serviceName;
  }

  @ResolveField(() => [DeploymentModel], { nullable: true })
  async deployments(@Parent() self: ComposeEntity) {
    return self.deployments;
  }
}
