import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { NodeAuthConfig } from './nodeAuthConfing.entity';
import { NodeComposeConfig } from './nodeComposeConfig.entity';

@Entity()
export class NodeConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => Node)
  nodes: Node[];

  @OneToMany(
    () => NodeAuthConfig,
    auth => auth.configs,
  )
  auth: NodeAuthConfig;

  @ManyToMany(
    () => NodeComposeConfig,
    compose => compose.configs,
  )
  composes: NodeComposeConfig[];
}
