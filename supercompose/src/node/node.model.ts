import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { ComposeModel } from './compose.model';

@ObjectType('Node')
export class NodeModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  host: string;

  @Field(() => Int)
  port: number;

  @Field()
  username: string;

  @Field({ nullable: true })
  password: string;

  @Field({ nullable: true })
  privateKey?: string;

  @Field(() => [ComposeModel])
  composes: ComposeModel[];
}
