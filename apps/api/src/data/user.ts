import { Kysely } from 'kysely';
import { generateId } from './id';
import { NewUsers, UsersId, UsersUpdate } from './types/public/Users';
import PublicSchema from './types/public/PublicSchema';

export function insertUser(db: Kysely<PublicSchema>, data: Omit<NewUsers, 'id'>) {
  const insertData = {
    id: generateId<UsersId>(),
    ...data,
  };
  return db.insertInto('users').values(insertData).returningAll().executeTakeFirstOrThrow();
}

export function updateUser(db: Kysely<PublicSchema>, id: UsersId, updateWith: UsersUpdate) {
  return db.updateTable('users').set(updateWith).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
}
