import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { NodeComposeConfigEntity } from './nodeComposeConfig.entity';

@Entity()
export class NodeServiceConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(
    () => NodeComposeConfigEntity,
    compose => compose.service,
  )
  composes: NodeComposeConfigEntity[];

  @Column()
  enabled: boolean;

  @Column({ length: 64 })
  serviceName: string;
}
