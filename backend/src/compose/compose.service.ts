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
}
