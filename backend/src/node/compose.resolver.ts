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
import { ComposeModel } from './compose.model';
import { ComposeVersionEntity } from './composeVersion.entity';

@Resolver(() => ComposeModel)
export class ComposeResolver {
  @InjectRepository(ComposeVersionEntity)
  private readonly composeRepo: Repository<ComposeVersionEntity>;

  @Query(() => ComposeModel)
  async compose(@Args('id', { type: () => ID }) id: string) {
    return this.composeRepo.findOne({ where: { id }, relations: ['service'] });
  }

  @Query(() => [ComposeModel])
  async composes() {
    return this.composeRepo.find({ relations: ['service'] });
  }

  @ResolveField(() => String)
  async name(@Parent() self: ComposeVersionEntity) {
    return self.compose.name;
  }

  @ResolveField(() => String)
  async content(@Parent() self: ComposeVersionEntity) {
    return self.content;
  }

  @ResolveField(() => Boolean)
  async serviceEnabled(@Parent() self: ComposeVersionEntity) {
    return self.serviceEnabled;
  }

  @ResolveField(() => String, { nullable: true })
  async serviceName(@Parent() self: ComposeVersionEntity) {
    return self.serviceName;
  }
}
