import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  Column,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { ComposeVersionEntity } from 'src/compose/composeVersion.entity';
import { DeploymentEntity } from 'src/deployment/deployment.entity';
import { TenantEntity } from 'src/tenant/tenant.entity';

@Entity('compose')
export class ComposeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

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

  @OneToMany(
    () => ComposeVersionEntity,
    x => x.compose,
  )
  versions: Promise<ComposeVersionEntity[]>;

  @OneToOne(() => ComposeVersionEntity)
  current: Promise<ComposeVersionEntity>;
}
