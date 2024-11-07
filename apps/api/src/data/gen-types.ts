import kanel from 'kanel';
import kanelKysely from 'kanel-kysely';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { getLogger } from '@tasky/logger';
import { getConfig } from '../config';
import { runMigrations } from '../db/migrations';

getConfig().then(async (config) => {
  const logger = getLogger(`${config.name} db-migrations`, config.version, config.logLevel);
  const kanelConfig: kanel.Config = {
    connection: config.postgresDbUrl,
    schemas: ['public'],
    preDeleteOutputFolder: true,
    outputPath: path.join(path.dirname(fileURLToPath(import.meta.url)), 'types'),
    customTypeMap: {
      'pg_catalog.tsvector': 'string',
      'pg_catalog.bpchar': 'string',
      'public.citext': 'string',
    },
    preRenderHooks: [kanelKysely.makeKyselyHook(), kanelKysely.kyselyCamelCaseHook],
  };
  await kanel.processDatabase(kanelConfig);
});
