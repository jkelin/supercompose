import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { NodeConfigEntity } from './nodeConfig.entity';

export interface AuthDefinition {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

@Entity('auth_config')
export class AuthConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  host: string;

  @Column({ type: 'int' })
  port: number;

  @Column({ type: 'text' })
  username: string;

  @Column({ type: 'text', nullable: true })
  password?: string;

  @Column({ type: 'text', nullable: true })
  privateKey?: string;

  @OneToMany(
    () => NodeConfigEntity,
    cfg => cfg.auth,
  )
  configs: NodeConfigEntity[];
}
