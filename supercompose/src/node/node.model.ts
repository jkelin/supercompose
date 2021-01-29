import { Post } from '@nestjs/common';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { ComposeModel } from './compose.model';
import { NodeEntity } from './node.entity';

@ObjectType('Node')
export class NodeModel {
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  host: string;

  @Field(type => Int)
  port: number;

  @Field()
  username: string;

  @Field({ nullable: true })
  password: string;

  @Field({ nullable: true })
  privateKey?: string;

  @Field(type => [ComposeModel])
  composes: ComposeModel[];
}
