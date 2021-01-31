import { PrimaryGeneratedColumn, Entity, ManyToOne, Column } from 'typeorm';
import { ComposeEntity } from './compose.entity';
import { ComposeVersionEntity } from './composeVersion.entity';
import { NodeEntity } from './node.entity';

@Entity('deployment')
export class DeploymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  enabled: boolean;

  @ManyToOne(
    () => ComposeEntity,
    x => x.deployments,
  )
  compose: ComposeEntity;

  @ManyToOne(() => ComposeVersionEntity)
  lastDeployedVersion: ComposeVersionEntity;

  @ManyToOne(
    () => NodeEntity,
    x => x.deployments,
  )
  node: NodeEntity;
}
