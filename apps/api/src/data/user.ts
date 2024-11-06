import { IDatabase as IPGDatabase } from 'pg-promise';
import { IContext } from '../context';
import { pgp } from '../db/db';
import { dataToDBData, lookupToReturning } from './helpers';
import { generateId, ID } from './id';
import pg from 'pg-promise/typescript/pg-subset';

export interface IDataUser {
  id: ID;
  firstName: string;
  lastName?: string;
  primaryEmailId?: ID;
}

const typeToDBName: { [P: string]: string } = {
  id: 'id',
  firstName: 'first_name',
  lastName: 'last_name',
  primaryEmailId: 'primary_email_id',
};

export function insertUser(context: IContext, data: Omit<IDataUser, 'id'>): Promise<IDataUser> {
  const userId = generateId();
  const dbDate = dataToDBData(typeToDBName, {
    id: userId,
    ...data,
  });
  const insertStatement = pgp.helpers.insert(dbDate, null, { table: 'users' });
  return (context.db.getDb() as IPGDatabase<{}, pg.IClient>).one<IDataUser>(
    `${insertStatement} RETURNING ${lookupToReturning(typeToDBName)}`,
  );
}
