import {
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  Entity,
} from 'typeorm';
import { NodeAuthConfigEntity } from './nodeAuthConfing.entity';
import { NodeComposeConfig } from './nodeComposeConfig.entity';
import { SuperComposeNodeEntity } from './SuperComposeNode.entity';

@Entity('node_config')
export class NodeConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => SuperComposeNodeEntity)
  nodes: SuperComposeNodeEntity[];

  @OneToMany(
    () => NodeAuthConfigEntity,
    auth => auth.configs,
  )
  auth: NodeAuthConfigEntity;

  @ManyToMany(
    () => NodeComposeConfig,
    compose => compose.configs,
  )
  composes: NodeComposeConfig[];
}
