import { ILogger } from '@tasky/logger';
import { IConfig } from './config';
import { IDatabase, waitDBConnect } from './db/db';

export interface IContext {
  config: IConfig;
  logger: ILogger;
  db: IDatabase;
}

export async function getContext(config: IConfig, logger: ILogger, db: IDatabase): Promise<IContext> {
  await waitDBConnect(db, 5);
  return {
    config,
    logger,
    db,
  };
}
