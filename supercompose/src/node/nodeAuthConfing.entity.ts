import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { NodeConfig } from './nodeConfig.entity';

@Entity()
export class NodeAuthConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  host: string;

  @Column({ type: 'int' })
  port: number;

  @Column({ type: 'text' })
  username: string;

  @Column({ type: 'text' })
  password?: string;

  @Column({ type: 'text' })
  privateKey?: string;

  @OneToMany(
    () => NodeConfig,
    cfg => cfg.auth,
  )
  configs: NodeConfig[];
}
