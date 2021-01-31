import { PrimaryGeneratedColumn, Entity, ManyToOne, Column } from 'typeorm';
import { ComposeEntity } from 'src/compose/compose.entity';
import { ComposeVersionEntity } from 'src/compose/composeVersion.entity';
import { NodeEntity } from 'src/node/node.entity';

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
