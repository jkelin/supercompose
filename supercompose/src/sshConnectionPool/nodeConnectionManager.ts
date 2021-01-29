import { NodeConnection } from './nodeConnection';
import EventEmitter from 'events';
import AsyncLock from 'async-lock';
import { Repository } from 'typeorm';
import { NodeConfigEntity } from 'src/node/nodeConfig.entity';

export class NodeConnectionManager {
  private node?: NodeConfigEntity;
  private connection?: NodeConnection;
  private shouldBeRunning = true;
  private nodeEvents = new EventEmitter();
  private maintainingPromise?: Promise<void>;
  private lock = new AsyncLock();

  constructor(
    private configId: string,
    private db: Repository<NodeConfigEntity>,
  ) {}

  private async maintainConnection() {
    try {
      while (this.shouldBeRunning) {
        console.warn('Connecting');
        let connectionDelay = 100;

        if (this.connection) {
          this.connection.close();
          this.connection.removeAllListeners('stateChange');
        }

        this.connection = new NodeConnection(this.configId, this.node?.auth);
        this.connection.on('stateChange', state => this.nodeEvents.emit(state));

        while (this.shouldBeRunning) {
          try {
            await this.connection?.connect();

            break;
          } catch (ex) {
            console.info(
              'Could not connect to node',
              this.configId,
              'because',
              ex.message,
              'waiting for',
              connectionDelay,
            );
            await new Promise(resolve => setTimeout(resolve, connectionDelay));
            connectionDelay = Math.min(connectionDelay * 2, 10 * 60 * 1000);
          }
        }

        if (!this.shouldBeRunning) {
          break;
        }

        await new Promise(resolve => this.nodeEvents.once('closed', resolve));
        console.info(
          'Underlying connection for',
          this.configId,
          'closed, reconnecting',
        );
      }
    } catch (ex) {
      console.error('Error while maintaining', this.configId, ex);
    }
  }

  public async start() {
    this.node = await this.db.findOne({ id: this.configId });
    this.maintainingPromise = this.maintainConnection();
  }

  public async stop() {
    this.shouldBeRunning = false;
  }

  public async runCommand(cmd: string) {
    return await this.lockConnection(async connection => {
      try {
        return connection.runCommand(cmd);
      } catch (ex) {
        console.error('Error while executing command', ex);
        throw ex;
      }
    });
  }

  public async fileExists(path: string) {
    return await this.lockConnection(async connection => {
      try {
        return connection.fileExists(path);
      } catch (ex) {
        console.error('Error while determining if file exists', ex);
        throw ex;
      }
    });
  }

  public async readFile(path: string) {
    return await this.lockConnection(async connection => {
      try {
        return connection.readFile(path);
      } catch (ex) {
        console.error('Error while reading file', ex);
        throw ex;
      }
    });
  }

  public async writeFile(
    path: string,
    content: string,
    opts: { recursive?: boolean },
  ) {
    return await this.lockConnection(async connection => {
      try {
        return connection.writeFile(path, content, opts);
      } catch (ex) {
        console.error('Error while writing file', ex);
        throw ex;
      }
    });
  }

  private async lockConnection<TRet>(
    action: (con: NodeConnection) => Promise<TRet>,
  ): Promise<TRet> {
    let data: TRet;
    await this.lock.acquire(
      this.configId,
      async () => {
        if (!this.connection) {
          throw new Error(
            `Connection ${this.configId} not running while attempting to lock connection`,
          );
        }

        if (this.connection.state !== 'ready') {
          console.info(
            'Connection',
            this.configId,
            'is waiting for internal ready state before locking connection',
          );
          await new Promise(resolve => this.nodeEvents.once('ready', resolve));
        }

        data = await action(this.connection);
      },
      {},
    );

    return data!;
  }
}
