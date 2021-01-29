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
import { NodeModel } from './node.model';
import { NodeEntity } from './node.entity';
import { ComposeModel } from './compose.model';

@Resolver(of => NodeModel)
export class NodeResolver {
  @InjectRepository(NodeEntity)
  private readonly nodeRepo: Repository<NodeEntity>;

  @Query(returns => NodeModel)
  async node(@Args('id', { type: () => ID }) id: string) {
    return this.nodeRepo.findOne({
      where: { id },
      relations: ['targetConfig', 'targetConfig.auth', 'targetConfig.composes'],
    });
  }

  @Query(returns => [NodeModel])
  async nodes() {
    return this.nodeRepo.find({
      relations: ['targetConfig', 'targetConfig.auth', 'targetConfig.composes'],
    });
  }

  @ResolveField()
  async name(@Parent() self: NodeEntity) {
    return self.name;
  }

  @ResolveField()
  async host(@Parent() self: NodeEntity) {
    return self.targetConfig.auth.host;
  }

  @ResolveField()
  async port(@Parent() self: NodeEntity) {
    return self.targetConfig.auth.port;
  }

  @ResolveField()
  async username(@Parent() self: NodeEntity) {
    return self.targetConfig.auth.username;
  }

  @ResolveField()
  async password(@Parent() self: NodeEntity) {
    return self.targetConfig.auth.password;
  }

  @ResolveField()
  async privateKey(@Parent() self: NodeEntity) {
    return self.targetConfig.auth.privateKey;
  }

  @ResolveField(type => [ComposeModel])
  async composes(@Parent() self: NodeEntity) {
    return self.targetConfig.composes;
  }
}
