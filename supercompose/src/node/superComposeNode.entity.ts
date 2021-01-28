import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { NodeConfig } from './nodeConfig.entity';

@Entity()
export class SuperComposeNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @OneToMany(
    () => NodeConfig,
    cfg => cfg.nodes,
  )
  targetConfig: NodeConfig;

  @OneToMany(
    () => NodeConfig,
    cfg => cfg.nodes,
  )
  lastAppliedConfig: NodeConfig;
}
