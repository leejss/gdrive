import Conf from 'conf';
import * as path from 'path';
import * as os from 'os';

interface ConfigSchema {
  defaultFolderId?: string;
  defaultDownloadLocation?: string;
  verbose?: boolean;
}

class Config {
  private conf: Conf<ConfigSchema>;

  constructor() {
    this.conf = new Conf<ConfigSchema>({
      projectName: 'gd-up',
      schema: {
        defaultFolderId: {
          type: 'string',
        },
        defaultDownloadLocation: {
          type: 'string',
          default: path.join(os.homedir(), 'Downloads'),
        },
        verbose: {
          type: 'boolean',
          default: false,
        },
      },
      configName: '.gduprc',
    });
  }

  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
    return this.conf.get(key);
  }

  set<K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]): void {
    this.conf.set(key, value);
  }

  delete<K extends keyof ConfigSchema>(key: K): void {
    this.conf.delete(key);
  }

  has<K extends keyof ConfigSchema>(key: K): boolean {
    return this.conf.has(key);
  }

  clear(): void {
    this.conf.clear();
  }

  getAll(): ConfigSchema {
    return this.conf.store;
  }
}

export const config = new Config();
