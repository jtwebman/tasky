import { ILogger } from '@tasky/logger';
import { IConfig } from './config';
import { waitDBConnect } from './db/db';
import postgres from 'postgres';

export interface IContext {
  config: IConfig;
  logger: ILogger;
  sql: postgres.Sql<{}>;
}

export async function getContext(config: IConfig, logger: ILogger, sql: postgres.Sql<{}>): Promise<IContext> {
  await waitDBConnect(sql, 5);
  return {
    config,
    logger,
    sql,
  };
}
