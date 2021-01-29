import { Post } from '@nestjs/common';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType('Compose')
export class ComposeModel {
  @Field(type => ID)
  id: string;

  @Field()
  contents: string;

  @Field()
  serviceEnabled: boolean;

  @Field({ nullable: true })
  serviceName?: string;
}
