import retry from 'async-retry';
import Database from '../data/types/Database';
import { Kysely, sql, CamelCasePlugin } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import postgres from 'postgres';
import PublicSchema from '../data/types/public/PublicSchema';

export interface IConnectionOptions {
  host?: string;
  password?: string;
  user?: string;
  port?: number;
  database?: string;
  client_encoding?: string;
  ssl?: boolean;
  application_name?: string;
  fallback_application_name?: string;
}

export function waitDBConnect(db: Kysely<PublicSchema>, retries: number = 6): Promise<Kysely<PublicSchema>> {
  return retry(
    async () => {
      await sql<any>`select 1 as result`.execute(db);
      return db;
    },
    {
      retries,
    },
  );
}

export function debug(_connection: number, query: string) {
  if (process.env.SHOW_SQL === '1') {
    console.log(query);
  }
}

export function getDB(connection: string | IConnectionOptions, maxConnection: number = 10) {
  let dialect: PostgresJSDialect;

  if (typeof connection !== 'string') {
    dialect = new PostgresJSDialect({
      postgres: postgres({
        ...connection,
        max: maxConnection,
      }),
    });
  } else {
    dialect = new PostgresJSDialect({
      postgres: postgres(connection, {
        max: maxConnection,
      }),
    });
  }
  return new Kysely<Database>({
    dialect,
    plugins: [new CamelCasePlugin()],
  });
}
