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
      relations: ['target', 'target.composes'],
    });
  }

  @Query(returns => [NodeModel])
  async nodes() {
    return this.nodeRepo.find({
      relations: ['target', 'target.composes'],
    });
  }

  @ResolveField()
  async name(@Parent() self: NodeEntity) {
    return self.name;
  }

  @ResolveField()
  async host(@Parent() self: NodeEntity) {
    return self.host;
  }

  @ResolveField()
  async port(@Parent() self: NodeEntity) {
    return self.port;
  }

  @ResolveField()
  async username(@Parent() self: NodeEntity) {
    return self.username;
  }

  @ResolveField(type => [ComposeModel])
  async composes(@Parent() self: NodeEntity) {
    return self.target.composes;
  }
}
