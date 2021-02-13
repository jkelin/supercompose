import { ObjectType, Field, ID } from '@nestjs/graphql';
import { DeploymentModel } from 'src/deployment/deployment.model';

@ObjectType('Compose')
export class ComposeModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  content: string;

  @Field()
  directory: string;

  @Field()
  serviceEnabled: boolean;

  @Field({ nullable: true })
  serviceName: string;

  @Field(() => [DeploymentModel])
  deployments: DeploymentModel[];
}
