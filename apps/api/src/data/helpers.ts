import postgres from 'postgres';

export function txIf<T>(sql: postgres.Sql<{}>, cb: (tx: postgres.TransactionSql<{}>) => T | Promise<T>) {
  if (sql.begin) {
    return sql.begin<T>(cb);
  }
  return cb(sql as postgres.TransactionSql<{}>);
}
