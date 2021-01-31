import isUtf8 from 'is-utf8';
import YAML from 'yaml';
import { Injectable, Scope } from '@nestjs/common';
import { SSHPoolService } from 'src/sshConnectionPool/sshpool.service';
import { IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ComposeVersionEntity } from 'src/compose/composeVersion.entity';
import { NodeEntity } from 'src/node/node.entity';
import { DeploymentEntity } from 'src/deployment/deployment.entity';

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
      for (const deployment of node.deployments) {
        await this.reconciliateCompose(deployment);
      }
    }
  }

  private async reconciliateCompose(deployment: DeploymentEntity) {
    console.info(
      'Reconciliating node',
      deployment.node.id,
      'compose',
      deployment.compose.id,
    );

    try {
      await this.ensureComposeFileIsUpToDate(deployment);
      if (deployment.compose.current.serviceEnabled) {
        await this.ensureServiceIsUpToDate(deployment);
      }

      await this.ensureServiceHasCorrectState(deployment);
    } catch (ex) {
      console.error(
        'Exception initCompose for node',
        deployment.node.id,
        'compose',
        deployment.compose.id,
        ex,
      );
    }
  }

  private async ensureServiceHasCorrectState(deployment: DeploymentEntity) {
    const systemctlVersion = await this.pool.runCommandOn(
      deployment.node.id,
      'systemctl --version',
    );
    if (systemctlVersion.code !== 0) {
      console.debug('Systemd unavailable, skipping service configuration');
    }

    const serviceStatusOutput = await this.pool.runCommandOn(
      deployment.node.id,
      `systemctl show ${deployment.compose.current.serviceName} --no-page`,
    );
    const serviceStatus = parseSystemctlShow(serviceStatusOutput.stdout);
    if (
      (serviceStatus['UnitFileState'] === 'enabled') !==
      deployment.compose.current.serviceEnabled
    ) {
      console.info(
        'Systemd service has incorrect state, setting to',
        deployment.compose.current.serviceEnabled ? 'enabled' : 'disabled',
      );

      const enablingRes = await this.pool.runCommandOn(
        deployment.node.id,
        `systemctl ${
          deployment.compose.current.serviceEnabled ? 'enable' : 'disable'
        } ${deployment.compose.current.serviceName}`,
      );

      if (enablingRes.code !== 0) {
        throw new Error(
          `Could not update status for service ${deployment.compose.current.serviceName}`,
        );
      }
    }
  }

  private async ensureServiceIsUpToDate(deployment: DeploymentEntity) {
    const systemctlVersion = await this.pool.runCommandOn(
      deployment.node.id,
      'systemctl --version',
    );
    if (systemctlVersion.code !== 0) {
      throw new Error('Systemctl not available');
    }

    const servicePath =
      '/etc/systemd/system/' +
      deployment.compose.current.serviceName +
      '.service';
    const targetServiceContents = generateServiceFile(
      deployment.compose.current,
    );
    const serviceFileExists = await this.pool.fileExistsOn(
      deployment.node.id,
      servicePath,
    );

    if (serviceFileExists) {
      console.debug(
        'Service file at',
        servicePath,
        'exists, reading and determining update',
      );

      const contents = await this.pool.readFileOn(
        deployment.node.id,
        servicePath,
      );

      if (contents.toString('utf8') === targetServiceContents) {
        console.debug('Service file at', servicePath, 'is already up-to-date');
        return;
      }
    }

    console.info('Updating service file at', servicePath);

    await this.pool.writeFileOn(
      deployment.node.id,
      servicePath,
      targetServiceContents,
    );

    console.info('Reloading systemd');

    await this.pool.runCommandOn(deployment.node.id, `systemctl daemon-reload`);
  }

  private async ensureComposeFileIsUpToDate(deployment: DeploymentEntity) {
    const composePath =
      deployment.compose.current.directory + 'docker-compose.yml';
    const composeExists = await this.pool.fileExistsOn(
      deployment.node.id,
      composePath,
    );

    if (!composeExists) {
      console.info('Compose file at', composePath, 'does not exist, writing');
      await this.pool.writeFileOn(
        deployment.node.id,
        composePath,
        deployment.compose.current.content,
      );
    } else {
      console.debug(
        'Compose file at',
        composePath,
        'exists, reading and determining update',
      );

      const contents = await this.pool.readFileOn(
        deployment.node.id,
        composePath,
      );

      if (isYamlOrJson(contents)) {
        if (contents.toString('utf-8') !== deployment.compose.current.content) {
          console.debug('Compose file at', composePath, 'outdated, updating');

          await this.pool.writeFileOn(
            deployment.node.id,
            composePath,
            deployment.compose.current.content,
            {
              recursive: true,
            },
          );
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
