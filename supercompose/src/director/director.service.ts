import isUtf8 from 'is-utf8';
import YAML from 'yaml';
import { Injectable, Scope } from '@nestjs/common';
import { SSHPoolService } from 'src/sshConnectionPool/sshpool.service';
import { IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ComposeVersionEntity } from 'src/node/composeVersion.entity';
import { NodeVersionEntity } from 'src/node/nodeVersion.entity';
import { NodeEntity } from 'src/node/node.entity';

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

function generateServiceFile(compose: ComposeVersionEntity) {
  return `[Unit]
Description=${compose.compose.name} service with docker compose managed by supercompose
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
export class DirectorService {
  constructor(
    @InjectRepository(NodeEntity)
    private readonly nodeRepo: Repository<NodeEntity>,
    private readonly pool: SSHPoolService,
  ) {}

  public async reconciliate() {
    const nodes = await this.nodeRepo.find({
      where: { target: Not(IsNull()) },
      relations: ['target', 'target.composes'],
    });

    for (const node of nodes) {
      for (const compose of node.target.composes) {
        await this.reconciliateCompose(node.target, compose);
      }
    }
  }

  private async reconciliateCompose(
    node: NodeVersionEntity,
    compose: ComposeVersionEntity,
  ) {
    console.info('Reconciliating node', node.id, 'compose', compose.id);

    try {
      await this.ensureComposeFileIsUpToDate(node, compose);
      if (compose.serviceEnabled) {
        await this.ensureServiceIsUpToDate(node, compose);
      }

      await this.ensureServiceHasCorrectState(node, compose);
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
    node: NodeVersionEntity,
    compose: ComposeVersionEntity,
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
      `systemctl show ${compose.serviceName} --no-page`,
    );
    const serviceStatus = parseSystemctlShow(serviceStatusOutput.stdout);
    if (
      (serviceStatus['UnitFileState'] === 'enabled') !==
      compose.serviceEnabled
    ) {
      console.info(
        'Systemd service has incorrect state, setting to',
        compose.serviceEnabled ? 'enabled' : 'disabled',
      );

      const enablingRes = await this.pool.runCommandOn(
        node.id,
        `systemctl ${compose.serviceEnabled ? 'enable' : 'disable'} ${
          compose.serviceName
        }`,
      );

      if (enablingRes.code !== 0) {
        throw new Error(
          `Could not update status for service ${compose.serviceName}`,
        );
      }
    }
  }

  private async ensureServiceIsUpToDate(
    node: NodeVersionEntity,
    compose: ComposeVersionEntity,
  ) {
    const systemctlVersion = await this.pool.runCommandOn(
      node.id,
      'systemctl --version',
    );
    if (systemctlVersion.code !== 0) {
      throw new Error('Systemctl not available');
    }

    const servicePath =
      '/etc/systemd/system/' + compose.serviceName + '.service';
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
    node: NodeVersionEntity,
    compose: ComposeVersionEntity,
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
