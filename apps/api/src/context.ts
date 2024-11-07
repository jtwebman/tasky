import { ILogger } from '@tasky/logger';
import { IConfig } from './config';
import { waitDBConnect } from './db/db';
import { Kysely } from 'kysely';
import PublicSchema from './data/types/public/PublicSchema';

export interface IContext {
  config: IConfig;
  logger: ILogger;
  db: Kysely<PublicSchema>;
}

export async function getContext(config: IConfig, logger: ILogger, db: Kysely<PublicSchema>): Promise<IContext> {
  await waitDBConnect(db, 5);
  return {
    config,
    logger,
    db,
  };
}
