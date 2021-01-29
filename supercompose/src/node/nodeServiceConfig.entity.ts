import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ComposeConfigEntity } from './composeConfig.entity';

@Entity('service_config')
export class ServiceConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(
    () => ComposeConfigEntity,
    compose => compose.service,
  )
  composes: ComposeConfigEntity[];

  @Column()
  enabled: boolean;

  @Column({ length: 64 })
  serviceName: string;
}
