import bcrypt from 'bcrypt';
import { IContext } from '../context';
import { insertEmail } from '../data/email';
import { insertLogin } from '../data/login';
import { EmailsId } from '../data/types/public/Emails';
import { UsersId } from '../data/types/public/Users';
import { insertUser, updateUser } from '../data/user';

export interface IUser {
  id: UsersId;
  firstName: string;
  lastName: string | null;
  primaryEmail: string;
  emails: {
    id: EmailsId;
    email: string;
    verified: boolean;
  }[];
  username: string | null;
}

export type ISignupData = Omit<IUser, 'id' | 'emails' | 'username'> & {
  login?: { username: string; password: string };
};

export function signup(context: IContext, data: ISignupData): Promise<IUser> {
  return context.db.transaction().execute(async (tx) => {
    let user = await insertUser(tx, { firstName: data.firstName, lastName: data.lastName });
    const email = await insertEmail(tx, { userId: user.id, email: data.primaryEmail, verified: false });
    user = await updateUser(tx, user.id, { primaryEmailId: email.id });

    const newUser: IUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      primaryEmail: email.email,
      emails: [
        {
          id: email.id,
          email: email.email,
          verified: email.verified,
        },
      ],
      username: null,
    };

    if (data.login) {
      // Login via username and password instead of just email
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(data.login.password, salt);
      const login = await insertLogin(tx, {
        userId: user.id,
        username: data.login.username,
        password: hashedPassword,
      });
      newUser.username = login.username;
    }
    return newUser;
  });
}
