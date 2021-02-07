import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Scope,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CryptoService } from 'src/crypto/crypto.service';
import { NodeEntity } from 'src/node/node.entity';
import { Repository } from 'typeorm';
import { NodeConnection } from './nodeConnection';
import { NodeConnectionManager } from './nodeConnectionManager';

export class TestConnectionError extends Error {
  public TYPE = 'TestConnectionError';

  constructor(
    public message: string,
    public field?: 'host' | 'port' | 'username' | 'password' | 'privateKey',
  ) {
    super(message);

    Object.setPrototypeOf(this, TestConnectionError.prototype);
  }
}

@Injectable({ scope: Scope.DEFAULT })
export class SSHPoolService implements OnModuleInit, OnModuleDestroy {
  private nodes?: NodeEntity[];
  private connections: Record<string, NodeConnectionManager> = {};

  constructor(
    @InjectRepository(NodeEntity)
    private readonly nodeRepo: Repository<NodeEntity>,
    private readonly crypto: CryptoService,
  ) {}

  public async onModuleInit() {
    this.nodes = await this.nodeRepo.find({
      where: { enabled: true },
    });

    for (const node of this.nodes) {
      const conn = (this.connections[node.id] = new NodeConnectionManager(
        node.id,
        this.nodeRepo,
        this.crypto,
      ));

      await conn.start();
    }
  }

  public async onModuleDestroy() {
    for (const conn of Object.values(this.connections)) {
      await conn.stop();
    }
  }

  public async runCommandOn(nodeId: string, cmd: string) {
    return this.connections[nodeId].runCommand(cmd);
  }

  public async fileExistsOn(nodeId: string, path: string) {
    return this.connections[nodeId].fileExists(path);
  }

  public async readFileOn(nodeId: string, path: string) {
    return this.connections[nodeId].readFile(path);
  }

  public async writeFileOn(
    nodeId: string,
    path: string,
    content: string,
    opts: { recursive?: boolean } = {},
  ) {
    return this.connections[nodeId].writeFile(path, content, opts);
  }

  public async testConnection(args: {
    host: string;
    username: string;
    port: number;
    password: string;
    privateKey: string;
  }) {
    const conn = new NodeConnection('TEST_CONNECTION', args);
    try {
      // TODO add some timeout and safeguards
      await conn.connect();
      // TODO check whole environment and permissions
      await conn.runCommand('whoami');
    } catch (ex) {
      if (ex.code === 'ENOTFOUND' && ex.syscall === 'getaddrinfo') {
        throw new TestConnectionError('Host not resolvable', 'host');
      } else if (ex.code === 'ECONNREFUSED') {
        throw new TestConnectionError('Connection refused', 'host');
      } else if (ex.level === 'client-timeout') {
        throw new TestConnectionError(ex.message, 'host');
      } else if (ex.level === 'client-authentication') {
        throw new TestConnectionError('Authentication failed');
      } else if (/Cannot parse privateKey: /.test(ex.message)) {
        throw new TestConnectionError(
          ex.message.replace(/Cannot parse privateKey: /, ''),
          'privateKey',
        );
      } else {
        console.error('Unknown Connection test error', { ex });
        throw new TestConnectionError(ex.message);
      }
    } finally {
      conn.close();
    }
  }
}
