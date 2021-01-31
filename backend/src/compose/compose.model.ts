import { ObjectType, Field, ID } from '@nestjs/graphql';
import { DeploymentModel } from 'src/deployment/deployment.model';
import { ManyToOne, OneToMany } from 'typeorm';
import { ComposeVersionEntity } from './composeVersion.entity';

@ObjectType('Compose')
export class ComposeModel {
  @Field(() => ID)
  id: string;

  @OneToMany(
    () => ComposeVersionEntity,
    x => x.compose,
  )
  history: ComposeVersionEntity[];

  @ManyToOne(() => ComposeVersionEntity)
  current: ComposeVersionEntity;

  @Field(() => [DeploymentModel])
  deployments: DeploymentModel[];
}
