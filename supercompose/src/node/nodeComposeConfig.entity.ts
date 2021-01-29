import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { NodeConfigEntity } from './nodeConfig.entity';
import { NodeServiceConfigEntity } from './nodeServiceConfig.entity';

@Entity()
export class NodeComposeConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  directory: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(
    () => NodeServiceConfigEntity,
    service => service.composes,
  )
  service: NodeServiceConfigEntity;

  @ManyToMany(
    () => NodeConfigEntity,
    cfg => cfg.composes,
  )
  configs: NodeConfigEntity[];
}
