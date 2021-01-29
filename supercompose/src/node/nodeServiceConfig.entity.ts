import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { NodeComposeConfig } from './nodeComposeConfig.entity';

@Entity()
export class NodeServiceConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(
    () => NodeComposeConfig,
    compose => compose.service,
  )
  composes: NodeComposeConfig[];

  @Column()
  enabled: boolean;

  @Column({ length: 64 })
  serviceName: string;
}
