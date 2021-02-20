import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Check,
} from 'typeorm';
import { DeploymentEntity } from 'deployment/deployment.entity';
import { TenantEntity } from 'tenant/tenant.entity';
import { Max, Min } from 'class-validator';

@Entity('node')
@Check(
  `("password" IS NOT NULL AND "privateKey" is NULL) OR ("privateKey" IS NOT NULL AND "password" is NULL)`,
)
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
  @Min(0)
  @Max(65535)
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
    { onDelete: 'CASCADE' },
  )
  tenant: Promise<TenantEntity>;

  @OneToMany(
    () => DeploymentEntity,
    x => x.node,
  )
  deployments: Promise<DeploymentEntity[]>;
}
