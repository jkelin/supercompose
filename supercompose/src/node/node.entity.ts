import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { NodeVersionEntity } from './nodeVersion.entity';
import { TenantEntity } from './tenant.entity';

@Entity('node')
export class NodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  host: string;

  @Column({ type: 'int' })
  port: number;

  @Column({ type: 'text' })
  username: string;

  @Column({ type: 'bytea', nullable: true })
  password?: Buffer;

  @Column({ type: 'bytea', nullable: true })
  privateKey?: Buffer;

  @ManyToOne(
    () => TenantEntity,
    x => x.nodes,
  )
  tenant: TenantEntity;

  @OneToMany(
    () => NodeVersionEntity,
    x => x.node,
  )
  versions: NodeVersionEntity[];

  @OneToOne(() => NodeVersionEntity)
  @JoinColumn()
  target: NodeVersionEntity;

  @OneToOne(() => NodeVersionEntity)
  @JoinColumn()
  last: NodeVersionEntity;
}
