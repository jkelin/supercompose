import {
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  Column,
  Unique,
} from 'typeorm';
import { ComposeEntity } from 'compose/compose.entity';
import { ComposeVersionEntity } from 'compose/composeVersion.entity';
import { NodeEntity } from 'node/node.entity';

@Entity('deployment')
@Unique(['compose', 'node'])
export class DeploymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  enabled: boolean;

  @ManyToOne(
    () => ComposeEntity,
    x => x.deployments,
    { onDelete: 'CASCADE' },
  )
  compose: Promise<ComposeEntity>;

  @ManyToOne(() => ComposeVersionEntity)
  lastDeployedVersion: ComposeVersionEntity;

  @ManyToOne(
    () => NodeEntity,
    x => x.deployments,
    { onDelete: 'CASCADE' },
  )
  node: Promise<NodeEntity>;
}
