import isUtf8 from 'is-utf8';
import YAML from 'yaml';
import { Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { SSHPoolService } from 'src/sshConnectionPool/sshpool.service';
import { IsNull, Not, Repository } from 'typeorm';
import { NodeComposeConfigEntity } from 'src/node/nodeComposeConfig.entity';
import { NodeConfigEntity } from 'src/node/nodeConfig.entity';
import { SuperComposeNodeEntity } from 'src/node/SuperComposeNode.entity';
import { InjectRepository } from '@nestjs/typeorm';

function isJson(what: string) {
  try {
    JSON.parse(what);
    return true;
  } catch (ex) {
    return false;
  }
}

function isYaml(what: string) {
  try {
    YAML.parse(what);
    return true;
  } catch (ex) {
    return false;
  }
}

function isYamlOrJson(file: Buffer) {
  try {
    if (!isUtf8(file)) {
      return false;
    }

    const str = file.toString('utf8');

    return isYaml(str) || isJson(str);
  } catch (ex) {
    console.debug('Error in isCompose', ex);
  }
}

function parseSystemctlShow(output: string): Record<string, string> {
  return Object.fromEntries(output.split('\n').map(x => x.split('=')));
}

function generateServiceFile(compose: NodeComposeConfigEntity) {
  return `[Unit]
Description=${compose.name} service with docker compose managed by supercompose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
WorkingDirectory=/etc/docker/compose/${compose.directory}
ExecStart=/usr/local/bin/docker-compose up -d --remove-orphans
ExecStop=/usr/local/bin/docker-compose down

[Install]
WantedBy=multi-user.target
  `;
}

@Injectable({ scope: Scope.DEFAULT })
export class DirectorService implements OnModuleInit {
  constructor(
    @InjectRepository(SuperComposeNodeEntity)
    private readonly nodeRepo: Repository<SuperComposeNodeEntity>,
    private readonly pool: SSHPoolService,
  ) {}

  public async onModuleInit() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.reconciliate();
  }

  public async reconciliate() {
    const nodes = await this.nodeRepo.find({
      where: { targetConfig: Not(IsNull()) },
      relations: [
        'targetConfig',
        'targetConfig.composes',
        'targetConfig.composes.service',
      ],
    });

    for (const node of nodes) {
      for (const compose of node.targetConfig.composes) {
        this.initCompose(node.targetConfig, compose);
      }
    }

    // while (true) {
    //   try {
    //     const resp = await this.nm.runCommandOn(
    //       "e35e3427-a80c-475c-9011-8cf606d5d636",
    //       "uptime"
    //     );
    //     console.warn(resp.stdout);
    //     await new Promise((resolve) => setTimeout(resolve, 1000));
    //   } catch (ex) {
    //     console.error("Exception in main loop", ex);
    //   }
    // }
  }

  private async initCompose(
    node: NodeConfigEntity,
    compose: NodeComposeConfigEntity,
  ) {
    try {
      await this.ensureComposeFileIsUpToDate(node, compose);
      if (compose.service) {
        if (compose.service.enabled) {
          await this.ensureServiceIsUpToDate(node, compose);
        }

        await this.ensureServiceHasCorrectState(node, compose);
      }
    } catch (ex) {
      console.error(
        'Exception initCompose for node',
        node.id,
        'compose',
        compose.id,
        ex,
      );
    }
  }

  private async ensureServiceHasCorrectState(
    node: NodeConfigEntity,
    compose: NodeComposeConfigEntity,
  ) {
    const systemctlVersion = await this.pool.runCommandOn(
      node.id,
      'systemctl --version',
    );
    if (systemctlVersion.code !== 0) {
      console.debug('Systemd unavailable, skipping service configuration');
    }

    const serviceStatusOutput = await this.pool.runCommandOn(
      node.id,
      `systemctl show ${compose.service.serviceName} --no-page`,
    );
    const serviceStatus = parseSystemctlShow(serviceStatusOutput.stdout);
    if (
      (serviceStatus['UnitFileState'] === 'enabled') !==
      compose.service.enabled
    ) {
      console.info(
        'Systemd service has incorrect state, setting to',
        compose.service.enabled ? 'enabled' : 'disabled',
      );

      const enablingRes = await this.pool.runCommandOn(
        node.id,
        `systemctl ${compose.service.enabled ? 'enable' : 'disable'} ${
          compose.service.serviceName
        }`,
      );

      if (enablingRes.code !== 0) {
        throw new Error(
          `Could not update status for service ${compose.service.serviceName}`,
        );
      }
    }
  }

  private async ensureServiceIsUpToDate(
    node: NodeConfigEntity,
    compose: NodeComposeConfigEntity,
  ) {
    const systemctlVersion = await this.pool.runCommandOn(
      node.id,
      'systemctl --version',
    );
    if (systemctlVersion.code !== 0) {
      throw new Error('Systemctl not available');
    }

    const servicePath =
      '/etc/systemd/system/' + compose.service.serviceName + '.service';
    const targetServiceContents = generateServiceFile(compose);
    const serviceFileExists = await this.pool.fileExistsOn(
      node.id,
      servicePath,
    );

    if (serviceFileExists) {
      console.debug(
        'Service file at',
        servicePath,
        'exists, reading and determining update',
      );

      const contents = await this.pool.readFileOn(node.id, servicePath);

      if (contents.toString('utf8') === targetServiceContents) {
        console.debug('Service file at', servicePath, 'is already up-to-date');
        return;
      }
    }

    console.info('Updating service file at', servicePath);

    await this.pool.writeFileOn(node.id, servicePath, targetServiceContents);

    console.info('Reloading systemd');

    await this.pool.runCommandOn(node.id, `systemctl daemon-reload`);
  }

  private async ensureComposeFileIsUpToDate(
    node: NodeConfigEntity,
    compose: NodeComposeConfigEntity,
  ) {
    const composePath = compose.directory + 'docker-compose.yml';
    const composeExists = await this.pool.fileExistsOn(node.id, composePath);

    if (!composeExists) {
      console.info('Compose file at', composePath, 'does not exist, writing');
      await this.pool.writeFileOn(node.id, composePath, compose.content);
    } else {
      console.debug(
        'Compose file at',
        composePath,
        'exists, reading and determining update',
      );

      const contents = await this.pool.readFileOn(node.id, composePath);

      if (isYamlOrJson(contents)) {
        if (contents.toString('utf-8') !== compose.content) {
          console.debug('Compose file at', composePath, 'outdated, updating');

          await this.pool.writeFileOn(node.id, composePath, compose.content, {
            recursive: true,
          });
        } else {
          console.debug('Compose file at', composePath, 'is up-to-date');
        }
      } else {
        console.info(
          'File at',
          composePath,
          'is neither yaml nor json. Skipping for safety reasons',
        );
      }
    }
  }
}
