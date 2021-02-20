import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ComposeVersionEntity } from 'compose/composeVersion.entity';
import { DeploymentEntity } from 'deployment/deployment.entity';
import { TenantEntity } from 'tenant/tenant.entity';

@Entity('compose')
export class ComposeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ default: false })
  pendingDelete: boolean;

  @ManyToOne(
    () => TenantEntity,
    x => x.nodes,
    { onDelete: 'CASCADE' },
  )
  tenant: Promise<TenantEntity>;

  @OneToMany(
    () => DeploymentEntity,
    x => x.compose,
  )
  deployments: Promise<DeploymentEntity[]>;

  @OneToMany('ComposeVersionEntity', 'compose')
  versions: Promise<ComposeVersionEntity[]>;

  @Column({ type: 'uuid' })
  currentId: string;

  @OneToOne('ComposeVersionEntity', {
    deferrable: 'INITIALLY DEFERRED',
  })
  @JoinColumn({ name: 'currentId' })
  current: Promise<ComposeVersionEntity>;
}
