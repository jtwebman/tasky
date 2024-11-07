import { Kysely } from 'kysely';
import { generateId } from './id';
import { NewLogins, LoginsId } from './types/public/Logins';
import PublicSchema from './types/public/PublicSchema';

export function insertLogin(db: Kysely<PublicSchema>, data: Omit<NewLogins, 'id'>) {
  const insertData = {
    id: generateId<LoginsId>(),
    ...data,
  };
  return db.insertInto('logins').values(insertData).returningAll().executeTakeFirstOrThrow();
}
