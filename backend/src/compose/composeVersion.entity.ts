import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ComposeEntity } from './compose.entity';

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

  @Column({ type: 'uuid' })
  composeId: string;

  @ManyToOne('ComposeEntity', 'versions', {
    onDelete: 'CASCADE',
    deferrable: 'INITIALLY DEFERRED',
  })
  @JoinColumn({ name: 'composeId' })
  compose: Promise<ComposeEntity>;
}
