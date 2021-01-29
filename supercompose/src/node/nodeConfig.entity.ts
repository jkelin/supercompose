import {
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  Entity,
  JoinTable,
} from 'typeorm';
import { AuthConfigEntity } from './authConfig.entity';
import { ComposeConfigEntity } from './composeConfig.entity';
import { NodeEntity } from './node.entity';

@Entity('node_config')
export class NodeConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(
    () => NodeEntity,
    x => x.targetConfig,
  )
  targetNodes: NodeEntity[];

  @OneToMany(
    () => NodeEntity,
    x => x.lastAppliedConfig,
  )
  lastAppliedConfigNodes: NodeEntity[];

  @ManyToOne(
    () => AuthConfigEntity,
    auth => auth.configs,
  )
  auth: AuthConfigEntity;

  @ManyToMany(
    () => ComposeConfigEntity,
    compose => compose.configs,
  )
  @JoinTable()
  composes: ComposeConfigEntity[];
}
