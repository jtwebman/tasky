import { ILogger } from '@tasky/logger';
import { IConfig } from './config';

export interface IContext {
  config: IConfig;
  logger: ILogger;
}

export async function getContext(config: IConfig, logger: ILogger): Promise<IContext> {
  return {
    config,
    logger,
  };
}
