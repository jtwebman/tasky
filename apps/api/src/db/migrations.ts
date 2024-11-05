import fs from 'node:fs';
import path from 'node:path';
import pgPromise from 'pg-promise';
import pgConnString from 'pg-connection-string';

import { getDB, IConnectionOptions, waitDBConnect } from './db.js';
import { ILogger } from '@tasky/logger';

const migrationTableName = 'migrations';

const databaseExistsSql = `SELECT EXISTS (SELECT FROM pg_database WHERE datname = $1)`;

const createDatabaseSql = `CREATE DATABASE $1:name`;

const userExistsSql = `SELECT EXISTS (SELECT FROM pg_roles WHERE rolname = $1)`;

const createUserSql = `CREATE USER $1:name WITH NOCREATEDB ENCRYPTED PASSWORD $2`;
const grantUserDBAccessSql = `GRANT CONNECT, TEMP ON DATABASE $1:name TO $2:name;`;
const grantUserSchemaAccessSql = `GRANT USAGE ON SCHEMA public TO $1:name;`;
const grantUserTableAccessSql =
  'GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public TO $1:name;';
const grantUserSequenceAccessSql = `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $1:name;`;
const grantUserFunctionAccessSql = `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO $1:name;`;

const migrationTableExistsSql = `SELECT EXISTS (
  SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${migrationTableName}'
)`;

const createMigrationTableSql = `
CREATE TABLE IF NOT EXISTS ${migrationTableName} (
  filename TEXT PRIMARY KEY NOT NULL, 
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
)`;

const getCurrentMigrationsSql = `SELECT filename FROM ${migrationTableName}`;

const insertPatchRanSql = `INSERT INTO ${migrationTableName} (filename) VALUES ($1)`;

/**
 * Runs the postgres migrations not already ran as wel las create the DB and user with password if they don't exist.
 * @param {string} patchFolder - The full path to the patch folder to read patches in order to run
 * @param {string} pgConnection  - The connection string that will be the final db, user, and password. The script will create if these are missing.
 * @param {string} pgMigrationConnection - The connection string for the actually running hte migrations and created the db and user as well as the migration table if missing.
 * @param {import('../logger/logger.js').Logger} logger - The logger to use for output and errors.
 */
export async function runMigrations(
  patchFolder: string,
  pgConnection: string,
  pgMigrationConnection: string,
  logger: ILogger,
) {
  logger.info('Starting DB Migrations');
  try {
    if (!patchFolder || !pgConnection || !pgMigrationConnection) {
      const missingSettings = [];
      if (!patchFolder) {
        missingSettings.push('patchFolder');
      }
      if (!pgConnection) {
        missingSettings.push('pgConnection');
      }
      if (!pgMigrationConnection) {
        missingSettings.push('pgMigrationConnection');
      }
      throw new Error(`Missing params ${missingSettings.join(' and ')}.`);
    }
    const pgMigrationConfig = pgConnString.parse(pgMigrationConnection);
    const pgConfig = pgConnString.parse(pgConnection);

    const migrationAdminDB = getDB(pgMigrationConnection, 10);

    await waitDBConnect(migrationAdminDB);

    logger.info(`Checking db ${pgConfig.database} exists.`);

    const databaseExistResults = await migrationAdminDB.getDb().one(databaseExistsSql, [pgConfig.database]);

    if (!databaseExistResults.exists) {
      logger.info(`Creating db ${pgConfig.database}.`);
      await migrationAdminDB.getDb().none(createDatabaseSql, [pgConfig.database]);
    }

    await migrationAdminDB.getDb().$pool.end();

    // Convert pg-connection-string return type to a local IConnectionOptions type
    const newDbConnectionOptions: IConnectionOptions = {
      host: pgMigrationConfig.host || undefined,
      password: pgMigrationConfig.password,
      user: pgMigrationConfig.user,
      port: pgMigrationConfig.port ? parseInt(pgMigrationConfig.port, 10) : undefined,
      database: pgMigrationConfig.database || undefined,
      client_encoding: pgMigrationConfig.client_encoding,
      ssl: typeof pgMigrationConfig.ssl === 'boolean' ? pgMigrationConfig.ssl : undefined,
      application_name: pgMigrationConfig.application_name,
      fallback_application_name: pgMigrationConfig.fallback_application_name,
    };

    const migrationDB = getDB({ ...newDbConnectionOptions, database: pgConfig.database || undefined }, 10);
    await waitDBConnect(migrationDB);

    if (pgConfig.user && pgConfig.password) {
      logger.info(`Checking user ${pgConfig.user} exists.`);
      const userExistsResults = await migrationDB.getDb().one(userExistsSql, [pgConfig.user]);

      if (!userExistsResults.exists) {
        logger.info(`Creating user ${pgConfig.user}.`);
        await migrationDB.getDb().none(createUserSql, [pgConfig.user, pgConfig.password]);
      }
    }

    logger.info('Checking migration table exists.');
    const tableExistResults = await migrationDB.getDb().one(migrationTableExistsSql);

    if (!tableExistResults.exists) {
      logger.info('Creating migration table.');
      await migrationDB.getDb().query(createMigrationTableSql);
    }

    const currentPatchesResults = (await migrationDB.getDb().manyOrNone(getCurrentMigrationsSql)) as {
      filename: string;
    }[];
    const currentAppliedPatches = currentPatchesResults.map((f) => f.filename);

    const patchesToRun = fs
      .readdirSync(patchFolder, { withFileTypes: true })
      .filter(
        (dirent) =>
          dirent.isFile() &&
          dirent.name.charAt(0) !== '.' &&
          dirent.name.endsWith('.sql') &&
          !currentAppliedPatches.includes(dirent.name),
      )
      .map((dirent) => dirent.name)
      .sort();

    for (let i = 0, len = patchesToRun.length; i < len; i++) {
      const filename = patchesToRun[i];
      try {
        logger.info(`Running ${filename}.`);
        const sql = new pgPromise.QueryFile(path.join(patchFolder, filename), { noWarnings: true });
        await migrationDB.getDb().any(sql);
        await migrationDB.getDb().none(insertPatchRanSql, filename);
      } catch (error: any) {
        logger.error(`Error Running ${filename}: ${error.stack || error}`);
      }
    }

    logger.info(`Granting user ${pgConfig.user} all permissions needed in db ${pgConfig.database}.`);
    await migrationDB.getDb().none(grantUserDBAccessSql, [pgConfig.database, pgConfig.user]);
    await migrationDB.getDb().none(grantUserSchemaAccessSql, [pgConfig.user]);
    await migrationDB.getDb().none(grantUserTableAccessSql, [pgConfig.user]);
    await migrationDB.getDb().none(grantUserSequenceAccessSql, [pgConfig.user]);
    await migrationDB.getDb().none(grantUserFunctionAccessSql, [pgConfig.user]);

    /* shutdown migration connection pool */
    await migrationDB.getDb().$pool.end();
  } catch (error: any) {
    logger.error(`Error running migrations: ${error.stack || error}`);
    throw error;
  }
}
