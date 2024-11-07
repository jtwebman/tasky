import bcrypt from 'bcrypt';
import { IContext } from '../context';
import { ISignupData, signup as dbSignup } from '../data/user';

/**
 * Signup a new user
 * @param context - The app context
 * @param data - Data needed for signup
 * @returns - Returns a user
 */
export async function signup(context: IContext, data: ISignupData) {
  const signupData = {
    ...data,
  };
  if (signupData.login) {
    const salt = await bcrypt.genSalt();
    signupData.login.password = await bcrypt.hash(signupData.login.password, salt);
  }
  const user = await dbSignup(context.sql, data);
  if (!user) {
    throw new Error('Error on user signup!');
  }
  return user;
}
