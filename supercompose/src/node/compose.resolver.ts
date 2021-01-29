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
import { NodeModel } from './node.model';
import { ComposeConfigEntity } from './composeConfig.entity';

@Resolver(of => ComposeModel)
export class ComposeResolver {
  @InjectRepository(ComposeConfigEntity)
  private readonly composeRepo: Repository<ComposeConfigEntity>;

  @Query(returns => ComposeModel)
  async compose(@Args('id', { type: () => ID }) id: string) {
    return this.composeRepo.findOne({ where: { id }, relations: ['service'] });
  }

  @Query(returns => [ComposeModel])
  async composes() {
    return this.composeRepo.find({ relations: ['service'] });
  }

  @ResolveField(type => String)
  async name(@Parent() self: ComposeConfigEntity) {
    return self.name;
  }

  @ResolveField(type => String)
  async content(@Parent() self: ComposeConfigEntity) {
    return self.content;
  }

  @ResolveField(type => Boolean)
  async serviceEnabled(@Parent() self: ComposeConfigEntity) {
    return self.service.enabled;
  }

  @ResolveField(type => String, { nullable: true })
  async serviceName(@Parent() self: ComposeConfigEntity) {
    return self.service.serviceName;
  }
}
