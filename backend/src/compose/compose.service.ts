import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { v4 } from 'uuid';
import { ComposeEntity } from './compose.entity';
import { ComposeVersionEntity } from './composeVersion.entity';

function serviceNameFromCompose(name: string) {
  return name.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-');
}

@Injectable()
export class ComposeService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,
    @InjectRepository(ComposeEntity)
    private readonly composeRepo: Repository<ComposeEntity>,
  ) {}

  public async create(args: {
    name: string;
    directory: string;
    serviceEnabled: boolean;
    compose: string;
  }) {
    const compose = new ComposeEntity();
    compose.id = v4();
    compose.name = args.name;

    const composeVersion = new ComposeVersionEntity();
    composeVersion.id = v4();
    composeVersion.compose = Promise.resolve(compose);
    composeVersion.content = args.compose;
    composeVersion.directory = args.directory;
    composeVersion.serviceEnabled = args.serviceEnabled;
    composeVersion.serviceName = serviceNameFromCompose(args.name);

    await this.manager.transaction(async trx => {
      await trx.save(compose);
      await trx.save(composeVersion);
      compose.current = Promise.resolve(composeVersion);
      await trx.save(compose);
    });

    return compose.id;
  }

  public async update(
    id: string,
    args: {
      name: string;
      directory: string;
      serviceEnabled: boolean;
      compose: string;
    },
  ) {
    await this.manager.transaction(async trx => {
      const compose = await this.composeRepo.findOne(id);

      if (!compose) {
        throw new Error(`Compose with id ${id} not found`);
      }

      compose.name = args.name;

      const composeVersion = new ComposeVersionEntity();
      composeVersion.id = v4();
      composeVersion.compose = Promise.resolve(compose);
      composeVersion.content = args.compose;
      composeVersion.directory = args.directory;
      composeVersion.serviceEnabled = args.serviceEnabled;
      composeVersion.serviceName = serviceNameFromCompose(args.name);

      await trx.save(composeVersion);
      compose.current = Promise.resolve(composeVersion);
      await trx.save(compose);
    });
  }

  public async delete(id: string) {
    await this.composeRepo.update({ id: id }, { pendingDelete: true });
  }
}
