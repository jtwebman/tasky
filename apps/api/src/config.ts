import { LogLevel } from '@tasky/logger';
import path from 'node:path';
import fs from 'node:fs/promises';
import appRootPath from 'app-root-path';

export interface IConfig {
  name: string;
  version: string;
  port: number;
  logLevel: LogLevel;
}

function readLogLevel(): LogLevel {
  switch (process.env.LOG_LEVEL?.toLocaleLowerCase()) {
    case 'trace':
      return 'trace';
    case 'debug':
      return 'debug';
    case 'warn':
      return 'warn';
    case 'error':
      return 'error';
    default:
      return 'info';
  }
}

export async function getConfig(): Promise<IConfig> {
  const packageBuff = await fs.readFile(path.join(appRootPath.path, 'apps', 'api', 'package.json'));
  const packageJson = JSON.parse(packageBuff.toString());

  return {
    name: packageJson.name,
    version: packageJson.version,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) || 3000 : 3000,
    logLevel: readLogLevel(),
  };
}
