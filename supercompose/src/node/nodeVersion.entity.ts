import {
  PrimaryGeneratedColumn,
  ManyToMany,
  Entity,
  JoinTable,
  ManyToOne,
} from 'typeorm';
import { ComposeVersionEntity } from './composeVersion.entity';
import { NodeEntity } from './node.entity';

@Entity('node_version')
export class NodeVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(
    () => ComposeVersionEntity,
    compose => compose.nodes,
  )
  @JoinTable()
  composes: ComposeVersionEntity[];

  @ManyToOne(
    () => NodeEntity,
    x => x.versions,
  )
  node: NodeEntity;
}
