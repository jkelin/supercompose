import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  Column,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { ComposeVersionEntity } from './composeVersion.entity';
import { DeploymentEntity } from './deployment.entity';
import { TenantEntity } from './tenant.entity';

@Entity('compose')
export class ComposeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(
    () => TenantEntity,
    x => x.nodes,
  )
  tenant: TenantEntity;

  @OneToMany(
    () => DeploymentEntity,
    x => x.compose,
  )
  deployments: DeploymentEntity[];

  @OneToMany(
    () => ComposeVersionEntity,
    x => x.compose,
  )
  versions: ComposeVersionEntity[];

  @OneToOne(() => ComposeVersionEntity)
  current: ComposeVersionEntity;
}
