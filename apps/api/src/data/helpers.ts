import postgres from 'postgres';

/**
 * Starts a postgres transaction if there isn't one already started
 * @param sql - postgres sql
 * @param cb - The cb function that will get the tx that works just like SQL
 * @returns - Returns a Promise of the type you define in the generic
 */
export function txIf<T>(sql: postgres.Sql<{}>, cb: (tx: postgres.TransactionSql<{}>) => T | Promise<T>) {
  if (sql.begin) {
    return sql.begin<T>(cb);
  }
  return cb(sql as postgres.TransactionSql<{}>);
}
