import fs from 'node:fs';
import path from 'node:path';
import pgConnString from 'pg-connection-string';

import { IConnectionOptions, debug } from './db.js';
import { ILogger } from '@tasky/logger';
import postgres from 'postgres';

const migrationTableName = 'migrations';

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

    let migrationAdminSql = postgres(pgMigrationConnection, {
      max: 1,
      debug,
    });

    logger.info(`Checking db ${pgConfig.database} exists.`);

    const databaseExistResults = await migrationAdminSql<
      {
        exists: boolean;
      }[]
    >`SELECT EXISTS (SELECT FROM pg_database WHERE datname = ${pgConfig.database || null})`;
    if (!databaseExistResults[0].exists) {
      logger.info(`Creating db ${pgConfig.database}.`);
      await migrationAdminSql`CREATE DATABASE ${migrationAdminSql(pgConfig.database || '')}`;
    }

    await migrationAdminSql.end();

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

    const migrationSql = postgres({
      ...newDbConnectionOptions,
      database: pgConfig.database || undefined,
      max: 1,
      debug,
    });

    if (pgConfig.user && pgConfig.password) {
      const userExistsResults = await migrationSql<
        {
          exists: boolean;
        }[]
      >`SELECT EXISTS (SELECT FROM pg_roles WHERE rolname = ${pgConfig.user})`;

      if (!userExistsResults[0].exists) {
        logger.info(`Creating user ${pgConfig.user}.`);
        await migrationSql`CREATE USER ${migrationSql(pgConfig.user)} WITH NOCREATEDB ENCRYPTED PASSWORD ${migrationSql.unsafe(`'${pgConfig.password}'`)}`;
      }
    }

    logger.info('Checking migration table exists.');
    const tableExistResults = await migrationSql<{ exists: boolean }[]>`SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ${migrationTableName}
    )`;

    if (!tableExistResults[0].exists) {
      logger.info('Creating migration table.');
      await migrationSql`CREATE TABLE IF NOT EXISTS ${migrationSql(migrationTableName)} (
        filename TEXT PRIMARY KEY NOT NULL, 
        created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )`;
    }

    const currentPatchesResults = await migrationSql<
      {
        filename: string;
      }[]
    >`SELECT filename FROM ${migrationSql(migrationTableName)}`;
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
        await migrationSql.file(path.join(patchFolder, filename));
        await migrationSql`INSERT INTO ${migrationSql(migrationTableName)} (filename) VALUES (${filename})`;
      } catch (error: any) {
        logger.error(`Error Running ${filename}: ${error.stack || error}`);
      }
    }

    logger.info(`Granting user ${pgConfig.user} all permissions needed in db ${pgConfig.database}.`);
    await migrationSql`GRANT CONNECT, TEMP ON DATABASE ${migrationSql(pgConfig.database || '')} TO ${migrationSql(pgConfig.user || '')};`;
    await migrationSql`GRANT USAGE ON SCHEMA public TO ${migrationSql(pgConfig.user || '')};`;
    await migrationSql`GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public TO ${migrationSql(pgConfig.user || '')};`;
    await migrationSql`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${migrationSql(pgConfig.user || '')};`;
    await migrationSql`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${migrationSql(pgConfig.user || '')};`;

    /* shutdown migration connection pool */
    await migrationSql.end();
  } catch (error: any) {
    logger.error(`Error running migrations: ${error.stack || error}`);
    throw error;
  }
}
