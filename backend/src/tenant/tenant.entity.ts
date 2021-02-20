import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { NodeEntity } from 'node/node.entity';
import { ComposeEntity } from 'compose/compose.entity';

@Entity('tenant')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => String)
  title: string;

  @OneToMany(
    () => NodeEntity,
    x => x.tenant,
  )
  nodes: Promise<NodeEntity[]>;

  @OneToMany(
    () => ComposeEntity,
    x => x.tenant,
  )
  composes: Promise<ComposeEntity[]>;
}
