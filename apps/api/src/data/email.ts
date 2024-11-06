import { generateId, ID } from './id';
import { IDatabase } from '../db/db';

export interface IDataEmail {
  id: ID;
  email: string;
  verified: boolean;
}

export function insertEmail(db: IDatabase, userId: ID, email: string) {
  const emailId = generateId();
  return db
    .getDb()
    .one(
      'INSERT INTO emails (id, user_id, email) VALUES ($1, $2, $3) ' +
        'RETURNING id, user_id as "userId", email, email_verified as emailVerified, ' +
        'created_at as "createdAt", updated_at as "updatedAt"',
      [emailId, userId, email],
    );
}
