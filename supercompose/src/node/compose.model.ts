import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('Compose')
export class ComposeModel {
  @Field(() => ID)
  id: string;

  @Field()
  contents: string;

  @Field()
  serviceEnabled: boolean;

  @Field({ nullable: true })
  serviceName?: string;
}
