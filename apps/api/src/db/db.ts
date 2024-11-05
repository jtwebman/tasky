import pgPromise, { IDatabase as IPGPromiseDatabase, ITask } from 'pg-promise';
import retry from 'async-retry';
import { ConnectionOptions } from 'pg-connection-string';

const pgpConfig = {
  capSQL: true,
  noWarnings: true,
  query: (e: { query: string }) => {
    if (process.env.SHOW_SQL === '1') {
      // eslint-disable-next-line no-console
      console.log(e.query); // leave console instead of using logger as this is only in dev environments
    }
  },
};

export interface IDatabase {
  /**
   * Make a transaction
   * @param cb - All code that needs to run i nthe transaction
   * @returns - the new transaction
   */
  tx: <T>(cb: (db: IDatabase) => Promise<T>) => Promise<T>;
  /**
   * Only creates a transaction if you are not in one already.
   * @param cb  All code that needs to run i nthe transaction
   * @returns - Returns the exist transaction if already in on or the new transaction
   */
  txIf: <T>(cb: (db: IDatabase) => Promise<T>) => Promise<T>;
  /**
   * Only use this internally in the data layer as it returns the raw db object
   */
  getDb: any;
}

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

function wrapDatabase(db: IPGPromiseDatabase<{}> | ITask<{}>): IDatabase {
  return {
    tx: <T>(cb: (db: IDatabase) => Promise<T>) => {
      return db.tx<T>((dbTx) => cb(wrapDatabase(dbTx)));
    },
    txIf: <T>(cb: (db: IDatabase) => Promise<T>) => {
      return db.txIf<T>((dbTx) => cb(wrapDatabase(dbTx)));
    },
    getDb: () => db,
  };
}

export const pgp = pgPromise(pgpConfig);

/**
 * Get the DB object. Doesn't connect to the DB yet.
 * @param config - The service config
 * @returns - The DB object
 */
export function getDB(connection: string | IConnectionOptions, maxConnection?: number): IDatabase {
  if (typeof connection === 'string') {
    return wrapDatabase(
      pgp({
        connectionString: connection,
        max: maxConnection,
      }),
    );
  }
  return wrapDatabase(
    pgp({
      ...connection,
      max: maxConnection,
    }),
  );
}

/**
 * Used to check the DB connection is working
 * @param db - The db pool to test
 * @param retries - The number of retries with an exponential backoff
 * @returns - The db you passed after a succesful connection to the actual db
 */
export function waitDBConnect(db: IDatabase, retries: number = 6): Promise<IDatabase> {
  return retry(
    async () => {
      const conn = await db.getDb().connect();
      conn.done();
      return db;
    },
    {
      retries,
    },
  );
}
