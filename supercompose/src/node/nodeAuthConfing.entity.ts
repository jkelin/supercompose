import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { NodeConfig } from './nodeConfig.entity';

@Entity('node_auth_config')
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

  @ManyToOne(
    () => NodeConfig,
    cfg => cfg.auth,
  )
  configs: NodeConfig[];
}
