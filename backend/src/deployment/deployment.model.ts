import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ComposeModel } from 'src/compose//compose.model';
import { NodeModel } from 'src/node/node.model';

@ObjectType('Deployment')
export class DeploymentModel {
  @Field(() => ID)
  id: string;

  @Field(() => NodeModel)
  node: NodeModel;

  @Field(() => ComposeModel)
  compose: ComposeModel;

  @Field()
  enabled: boolean;
}
