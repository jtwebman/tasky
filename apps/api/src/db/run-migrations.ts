import path from 'node:path';
import { fileURLToPath } from 'url';
import { getLogger } from '@tasky/logger';
import { getConfig } from '../config';

import { runMigrations } from './migrations';

getConfig().then(async (config) => {
  const logger = getLogger(`${config.name} db-migrations`, config.version, config.logLevel);
  await runMigrations(
    path.join(path.dirname(fileURLToPath(import.meta.url)), './patches'),
    config.postgresDbUrl,
    config.postgresMigrationURl,
    logger,
  );
});
