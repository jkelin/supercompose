import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { NodeConfig } from './nodeConfig.entity';

@Entity()
export class SuperComposeNodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(
    () => NodeConfig,
    cfg => cfg.targetNodes,
  )
  targetConfig: NodeConfig;

  @ManyToOne(
    () => NodeConfig,
    cfg => cfg.lastAppliedConfigNodes,
  )
  lastAppliedConfig: NodeConfig;
}
