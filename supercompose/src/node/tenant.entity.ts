import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { NodeEntity } from './node.entity';

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
  nodes: NodeEntity[];
}
