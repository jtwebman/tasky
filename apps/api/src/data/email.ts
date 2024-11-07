import { Kysely } from 'kysely';
import { generateId } from './id';
import { NewEmails, EmailsId } from './types/public/Emails';
import PublicSchema from './types/public/PublicSchema';

export function insertEmail(db: Kysely<PublicSchema>, data: Omit<NewEmails, 'id'>) {
  const insertData = {
    id: generateId<EmailsId>(),
    ...data,
  };
  return db.insertInto('emails').values(insertData).returningAll().executeTakeFirstOrThrow();
}
