import { generateId } from './id';
import postgres from 'postgres';
import { UserId } from './user';

export type LoginId = string & { __brand: 'LoginId' };

export interface ILogin {
  readonly id: LoginId;
  readonly userId: UserId;
  readonly username: string;
  readonly password: string;
}

/**
 * Add a user login
 * @param sql - postgres sql
 * @param userId - User ID
 * @param username - username
 * @param password - password hash
 * @returns - The new login ID
 */
export async function addUserLogin(sql: postgres.Sql<{}>, userId: UserId, username: string, password: string) {
  const loginId = generateId<LoginId>();
  await sql`INSERT INTO logins (id, user_id, username, password) VALUES (${loginId}, ${userId}, ${username}, ${password})`;
  return loginId;
}

/**
 * Get a user login by user ID
 * @param sql - postgres sql
 * @param userId - User ID
 * @returns - Return the login or null
 */
export async function getUserLogin(sql: postgres.Sql<{}>, userId: UserId) {
  const results = await sql<
    readonly (ILogin | undefined)[]
  >`SELECT id, user_id, username, password FROM logins WHERE user_id = ${userId}`;
  return results.at(0) || null;
}
