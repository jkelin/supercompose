import {
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  Entity,
  JoinTable,
} from 'typeorm';
import { NodeAuthConfigEntity } from './nodeAuthConfing.entity';
import { NodeComposeConfigEntity } from './nodeComposeConfig.entity';
import { SuperComposeNodeEntity } from './SuperComposeNode.entity';

@Entity()
export class NodeConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @OneToMany(
    () => SuperComposeNodeEntity,
    x => x.targetConfig,
  )
  targetNodes: SuperComposeNodeEntity[];

  @OneToMany(
    () => SuperComposeNodeEntity,
    x => x.lastAppliedConfig,
  )
  lastAppliedConfigNodes: SuperComposeNodeEntity[];

  @ManyToOne(
    () => NodeAuthConfigEntity,
    auth => auth.configs,
  )
  auth: NodeAuthConfigEntity;

  @ManyToMany(
    () => NodeComposeConfigEntity,
    compose => compose.configs,
  )
  @JoinTable()
  composes: NodeComposeConfigEntity[];
}
