import { generateId } from './id';
import postgres from 'postgres';
import { UserId } from './user';

export type EmailId = string & { __brand: 'EmailId' };

export interface IEmail {
  readonly id: EmailId;
  readonly email: string;
  readonly verified: boolean;
}

/**
 *
 * @param sql Adds a email to a users email list and returns the email ID.
 * @param userId - User ID to the email belongs too
 * @param email - The email address
 * @returns - Email ID
 */
export async function addEmailToUser(sql: postgres.Sql<{}>, userId: UserId, email: string) {
  const emailId = generateId<EmailId>();
  await sql`INSERT INTO emails (id, user_id, email) VALUES (${emailId}, ${userId}, ${email})`;
  return emailId;
}

export function getUserEmails(sql: postgres.Sql<{}>, userId: UserId) {
  return sql<IEmail[]>`SELECT id, email, verified FROM emails WHERE user_id = ${userId}`;
}
