import retry from 'async-retry';
import postgres from 'postgres';

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

export function waitDBConnect(sql: postgres.Sql<{}>, retries: number = 6) {
  return retry(
    async () => {
      await sql<any>`select 1 as result`;
      return sql;
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
  const commonSetting = {
    max: maxConnection,
    transform: postgres.camel,
    debug,
  };
  if (typeof connection !== 'string') {
    return postgres({
      ...connection,
      ...commonSetting,
    });
  }
  return postgres(connection, commonSetting);
}
