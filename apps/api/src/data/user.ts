import { generateId } from './id';
import { addEmailToUser, EmailId, getUserEmails, IEmail } from './email';
import { addUserLogin, getUserLogin } from './login';
import postgres from 'postgres';
import { txIf } from './helpers';

export type UserId = string & { __brand: 'UserId' };

export interface IUser {
  id: UserId;
  firstName: string;
  lastName: string | null;
  primaryEmail: string;
  emails: IEmail[];
  username: string | null;
}

interface IUserTable {
  readonly firstName: string;
  readonly lastName: string | null;
  readonly primaryEmailId: EmailId;
}

export interface ISignupData {
  firstName: string;
  lastName?: string;
  primaryEmail: string;
  login?: {
    username: string;
    password: string;
  };
}

/**
 * Sets the users primary email ID
 * @param sql - postgres sql
 * @param id - User ID
 * @param emailId - Email ID
 */
export async function setUserPrimaryEmail(sql: postgres.Sql<{}>, id: UserId, emailId: EmailId) {
  await sql`UPDATE users SET primary_email_id = ${emailId} WHERE id = ${id}`;
}

export function userSignup(sql: postgres.Sql<{}>, data: ISignupData) {
  return txIf(sql, async (tx) => {
    const userId = generateId<UserId>();
    await sql`INSERT INTO users (id, first_name, last_name) VALUES (${userId}, ${data.firstName}, ${data.lastName || null})`;
    const emailId = await addEmailToUser(tx, userId, data.primaryEmail);
    await setUserPrimaryEmail(tx, userId, emailId);

    if (data.login) {
      await addUserLogin(tx, userId, data.login.username, data.login.password);
    }
    return getUser(tx, userId);
  });
}

async function getUserData(sql: postgres.Sql<{}>, id: UserId) {
  const results = await sql`SELECT first_name, last_name, primary_email_id FROM users WHERE id = ${id}`;
  return results.at(0) as IUserTable;
}

export async function getUser(sql: postgres.Sql<{}>, id: UserId) {
  const [userdata, emailsData, login] = await Promise.all([
    getUserData(sql, id),
    getUserEmails(sql, id),
    getUserLogin(sql, id),
  ]);

  if (userdata) {
    let primaryEmail = '';
    const emails: IEmail[] = [];
    emailsData.forEach((email) => {
      emails.push(email);
      if (userdata.primaryEmailId === email.id) {
        primaryEmail = email.email;
      }
    });
    const user: IUser = {
      id,
      firstName: userdata.firstName,
      lastName: userdata.lastName,
      primaryEmail,
      emails,
      username: null,
    };
    if (login) {
      user.username = login.username;
    }
    return user;
  }
  return null;
}
