import {
  Args,
  createUnionType,
  Field,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Parent,
  PartialType,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NodeModel } from './node.model';
import { NodeEntity } from './node.entity';
import { DeploymentModel } from 'src/deployment/deployment.model';
import { Max, Min } from 'class-validator';
import { NodeService } from './node.service';
import { SSHPoolService } from 'src/sshConnectionPool/sshpool.service';

@InputType()
export class NodeInput {
  @Min(0)
  @Max(65535)
  @Field()
  host: string;

  @Field(() => Int)
  port: number;

  @Field()
  username: string;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  privateKey?: string;
}

@InputType()
export class CreateNodeInput extends PartialType(NodeInput) {
  @Field()
  name: string;
}

@InputType()
export class TestConnectionInput extends PartialType(NodeInput) {}

@ObjectType()
export class TestConnectionError {
  @Field()
  error: string;

  @Field({ nullable: true })
  field?: 'host' | 'port' | 'username' | 'password' | 'privatekey';
}

export const CreateNodeResult = createUnionType({
  name: 'CreateNodeResult',
  types: () => [NodeModel, TestConnectionError],
  resolveType(val) {
    return val.error ? TestConnectionError : NodeModel;
  },
});

@Resolver(() => NodeModel)
export class NodeResolver {
  @InjectRepository(NodeEntity)
  private readonly nodeRepo: Repository<NodeEntity>;

  constructor(
    private readonly nodeService: NodeService,
    private readonly sshService: SSHPoolService,
  ) {}

  @Mutation(() => CreateNodeResult)
  async createNode(@Args('node') node: CreateNodeInput) {
    try {
      await this.sshService.testConnection({
        host: node.host,
        port: node.port,
        username: node.username,
        password: node.password,
        privateKey: node.privateKey,
      });
    } catch (ex) {
      if (ex.TYPE === 'TestConnectionError') {
        const err = new TestConnectionError();
        err.error = ex.message;
        err.field = ex.field;

        return err;
      }

      throw ex;
    }

    const nodeId = await this.nodeService.createNode({
      name: node.name,
      host: node.host,
      port: node.port,
      username: node.username,
      password: node.password,
      privateKey: node.privateKey,
    });

    return await this.node(nodeId);
  }

  @Mutation(() => TestConnectionError, { nullable: true })
  async testConnection(@Args('node') node: TestConnectionInput) {
    try {
      await this.sshService.testConnection({
        host: node.host,
        port: node.port,
        username: node.username,
        password: node.password,
        privateKey: node.privateKey,
      });

      return null;
    } catch (ex) {
      if (ex.TYPE === 'TestConnectionError') {
        const err = new TestConnectionError();
        err.error = ex.message;
        err.field = ex.field;

        return err;
      }

      throw ex;
    }
  }

  @Query(() => NodeModel)
  async node(@Args('id', { type: () => ID }) id: string) {
    return this.nodeRepo.findOne({
      where: { id },
      relations: ['deployments', 'deployments.compose'],
    });
  }

  @Query(() => [NodeModel])
  async nodes() {
    return this.nodeRepo.find({
      order: {
        name: 'ASC',
      },
      relations: ['deployments', 'deployments.compose'],
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

  @ResolveField(() => [DeploymentModel], { nullable: true })
  async deployments(@Parent() self: NodeEntity) {
    return self.deployments;
  }
}
