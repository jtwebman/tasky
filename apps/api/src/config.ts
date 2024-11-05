import { LogLevel } from '@tasky/logger';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'url';

export interface IConfig {
  name: string;
  version: string;
  port: number;
  logLevel: LogLevel;
  postgresDbUrl: string;
  postgresMigrationURl: string;
  postgresDbPoolSize: number;
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
  const packageBuff = await fs.readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), '../package.json'));
  const packageJson = JSON.parse(packageBuff.toString());

  return {
    name: packageJson.name,
    version: packageJson.version,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) || 3000 : 3000,
    logLevel: readLogLevel(),
    postgresDbUrl: process.env.POSTGRES_DB_URL || 'postgres://tasky-user:password123!@0.0.0.0:15432/dev-tasky-api',
    postgresMigrationURl:
      process.env.POSTGRES_DB_MIGRATION_URL || 'postgres://root-user:password123!@0.0.0.0:15432/postgres',
    postgresDbPoolSize: process.env.POSTGRES_DB_POOL_SIZE ? parseInt(process.env.POSTGRES_DB_POOL_SIZE, 10) || 50 : 50,
  };
}
