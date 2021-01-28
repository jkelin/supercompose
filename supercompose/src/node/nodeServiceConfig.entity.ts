import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { NodeComposeConfig } from './nodeComposeConfig.entity';

@Entity('node_service_config')
export class NodeServiceConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => NodeComposeConfig,
    compose => compose.service,
  )
  composes: NodeComposeConfig[];

  @Column()
  enabled: boolean;

  @Column({ length: 64 })
  serviceName: string;
}
