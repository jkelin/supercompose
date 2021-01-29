import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { NodeConfigEntity } from './nodeConfig.entity';

@Entity()
export class SuperComposeNodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(
    () => NodeConfigEntity,
    cfg => cfg.targetNodes,
  )
  targetConfig: NodeConfigEntity;

  @ManyToOne(
    () => NodeConfigEntity,
    cfg => cfg.lastAppliedConfigNodes,
  )
  lastAppliedConfig: NodeConfigEntity;
}
