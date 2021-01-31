import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { DeploymentEntity } from 'src/deployment/deployment.entity';
import { TenantEntity } from 'src/tenant/tenant.entity';

@Entity('node')
export class NodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  enabled: boolean;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  host: string;

  @Column({ type: 'int' })
  port: number;

  @Column({ type: 'text' })
  username: string;

  @Column({ type: 'bytea', nullable: true })
  password?: Buffer;

  @Column({ type: 'bytea', nullable: true })
  privateKey?: Buffer;

  @ManyToOne(
    () => TenantEntity,
    x => x.nodes,
  )
  tenant: TenantEntity;

  @OneToMany(
    () => DeploymentEntity,
    x => x.node,
  )
  deployments: DeploymentEntity[];
}
