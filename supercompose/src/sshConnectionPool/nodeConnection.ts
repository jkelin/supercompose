import { Client, SFTPWrapper } from 'ssh2';
import EventEmitter from 'events';
import { promisify } from 'util';
import { dirname } from 'path';
import { NodeAuthConfigEntity } from 'src/node/nodeAuthConfing.entity';

type NodeConnectionState =
  | 'pending'
  | 'connecting'
  | 'closed'
  | 'ready'
  | 'executing';

export class NodeConnection extends EventEmitter {
  public state: NodeConnectionState = 'pending';
  private client?: Client;

  constructor(private id: string, private credentials: NodeAuthConfigEntity) {
    super({});
  }

  private setState(state: NodeConnectionState) {
    this.state = state;
    console.debug('NodeConnection', this.id, 'is updating state to', state);
    this.emit('stateChange', state);
  }

  public async connect() {
    if (this.state !== 'pending' && this.state !== 'closed') {
      throw new Error(`Cannot connect while in state ${this.state}`);
    }

    console.info(
      'NodeConnection',
      this.id,
      'connecting to',
      `${this.credentials.username}@${this.credentials.host}:${this.credentials.port}`,
    );

    this.setState('connecting');
    this.client = new Client();

    this.client.on('close', withError => {
      console.info(
        'NodeConnection',
        this.id,
        'closed',
        withError ? 'with error' : '',
      );
      this.setState('closed');
    });

    await new Promise<void>((resolve, reject) => {
      const errorListener = (err: Error) => {
        console.error(
          'Error in NodeConnection',
          this.id,
          'while connecting',
          err,
        );

        return reject(err);
      };

      this.client?.once('error', errorListener);
      this.client?.once('ready', () => {
        resolve();
        this.client?.removeListener('error', errorListener);
      });

      this.client?.once('close', () =>
        errorListener(new Error('Closed while connecting')),
      );

      this.client!.connect(this.credentials);
    });

    this.client.on('error', err => {
      console.error('NodeConnection', this.id, 'error', err);
    });

    this.setState('ready');
  }

  public async runCommand(
    cmd: string,
  ): Promise<{
    code: number;
    signal: string;
    stdout: string;
    stderr: string;
  }> {
    if (this.state !== 'ready') {
      throw new Error(
        `NodeConnection ${this.id} cannot run command while in state ${this.state}`,
      );
    }

    this.setState('executing');
    console.info('NodeConnection', this.id, 'running command', cmd);

    try {
      return await new Promise(async (resolve, reject) => {
        const run = () =>
          this.client!.exec(cmd, (err, channel) => {
            if (err) {
              return reject(err);
            }

            const stdout: Buffer[] = [];
            const stderr: Buffer[] = [];

            channel
              .on('close', function(code: any, signal: any) {
                resolve({
                  code,
                  signal,
                  stdout: stdout.map(x => x.toString('utf-8')).join(''),
                  stderr: stderr.map(x => x.toString('utf-8')).join(''),
                });
              })
              .on('data', function(data: any) {
                stdout.push(data);
              })
              .stderr.on('data', function(data) {
                stderr.push(data);
              });
          });

        while (!run()) {
          console.info(
            'NodeConnection',
            this.id,
            'waiting for continue to run command',
            cmd,
          );
          await new Promise(resolve => this.client?.once('continue', resolve));
        }
      });
    } catch (ex) {
      console.error('Error while executing command', ex);
      throw ex;
    } finally {
      this.setState('ready');
    }
  }

  public async fileExists(path: string) {
    return await this.sftp(async sftp => {
      const stat = promisify(sftp.stat.bind(sftp));
      console.debug(
        'NodeConnection',
        this.id,
        'determining file exists on',
        path,
      );
      try {
        return (await stat(path))?.isFile() || false;
      } catch (ex) {
        if (ex.code === 2) {
          return false;
        }

        throw ex;
      }
    });
  }

  public async readFile(path: string) {
    return await this.sftp(async sftp => {
      const readFile = promisify(sftp.readFile.bind(sftp));
      console.debug('NodeConnection', this.id, 'reading file', path);
      return await readFile(path);
    });
  }

  private async ensureDirectoryExists(sftp: SFTPWrapper, dir: string) {
    const stat = promisify(sftp.stat.bind(sftp));
    const mkdir = promisify(sftp.mkdir.bind(sftp));

    try {
      const dirStat = await stat(dir);

      if (!dirStat.isDirectory()) {
        throw new Error(`Existing path ${dir} is not a directory`);
      }
    } catch (ex) {
      if (ex.code === 2) {
        const parentDir = dirname(dir);

        await this.ensureDirectoryExists(sftp, parentDir);

        console.debug('NodeConnection', this.id, 'writing folder', dir);
        await mkdir(dir);
      } else {
        throw ex;
      }
    }
  }

  public async writeFile(
    path: string,
    content: string,
    opts: { recursive?: boolean },
  ) {
    return await this.sftp(async sftp => {
      const writeFile = promisify(sftp.writeFile.bind(sftp));

      if (opts.recursive) {
        await this.ensureDirectoryExists(sftp, dirname(path));
      }

      console.debug('NodeConnection', this.id, 'writing file', path);

      return await (writeFile as any)(path, content, {
        encoding: 'utf-8',
        flag: 'w',
      });
    });
  }

  public async close() {
    if (
      this.state === 'connecting' ||
      this.state === 'executing' ||
      this.state === 'ready'
    ) {
      console.info('Disconnecting', this.id);
      this.client?.end();
    }
  }

  private async sftp<TResp>(
    action: (sftp: SFTPWrapper) => Promise<TResp>,
  ): Promise<TResp> {
    if (this.state !== 'ready') {
      throw new Error(
        `NodeConnection ${this.id} cannot open sftp while in state ${this.state}`,
      );
    }

    this.setState('executing');
    console.info('NodeConnection', this.id, 'opening sftp');

    try {
      return await new Promise(async (resolve, reject) => {
        const run = () =>
          this.client!.sftp((err, sftp) => {
            if (err) {
              return reject(err);
            }

            return resolve(action(sftp));
          });

        while (!run()) {
          console.info(
            'NodeConnection',
            this.id,
            'waiting for continue to open sftp',
          );
          await new Promise(resolve => this.client?.once('continue', resolve));
        }
      });
    } catch (ex) {
      console.error('Error while running sftp', ex);
      throw ex;
    } finally {
      this.setState('ready');
    }
  }
}
