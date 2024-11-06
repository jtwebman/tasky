import { IDatabase } from '../db/db';
import { generateId, ID } from './id';

export interface IDataLogin {
  username?: string;
  password?: string;
}

export function insertLogin(db: IDatabase, userId: ID, username: string, password: string) {
  const loginId = generateId();
  return db
    .getDb()
    .one(
      'INSERT INTO logins (id, user_id, username, password) VALUES ($1, $2, $3, $4) ' +
        'RETURNING id, user_id as "userId", username, password, ' +
        'created_at as "createdAt", updated_at as "updatedAt"',
      [loginId, userId, username, password],
    );
}
