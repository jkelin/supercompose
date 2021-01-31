import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { DeploymentModel } from 'src/deployment/deployment.model';

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

  @Field(() => [DeploymentModel])
  deployments: DeploymentModel[];
}
