import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { ComposeEntity } from './compose.entity';
import { NodeVersionEntity } from './nodeVersion.entity';

@Entity('compose_version')
export class ComposeVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 255 })
  directory: string;

  @Column({ length: 255, nullable: true })
  serviceName?: string;

  @Column()
  serviceEnabled: boolean;

  @ManyToOne(
    () => ComposeEntity,
    x => x.versions,
  )
  compose: ComposeEntity;

  @ManyToMany(
    () => NodeVersionEntity,
    x => x.composes,
  )
  nodes: NodeVersionEntity[];
}