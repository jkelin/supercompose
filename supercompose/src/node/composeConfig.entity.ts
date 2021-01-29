import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { NodeConfigEntity } from './nodeConfig.entity';
import { ServiceConfigEntity } from './nodeServiceConfig.entity';

@Entity('compose_config')
export class ComposeConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  directory: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(
    () => ServiceConfigEntity,
    service => service.composes,
  )
  service: ServiceConfigEntity;

  @ManyToMany(
    () => NodeConfigEntity,
    cfg => cfg.composes,
  )
  configs: NodeConfigEntity[];
}
