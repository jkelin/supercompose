import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { NodeConfig } from './nodeConfig.entity';
import { NodeServiceConfig } from './nodeServiceConfig.entity';

@Entity()
export class NodeComposeConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  directory: string;

  @Column({ type: 'text' })
  content: string;

  @OneToMany(
    () => NodeServiceConfig,
    service => service.composes,
  )
  service: NodeServiceConfig;

  @ManyToMany(
    () => NodeConfig,
    cfg => cfg.composes,
  )
  configs: NodeConfig[];
}
