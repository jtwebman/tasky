import bcrypt from 'bcrypt';
import { IContext } from '../context';
import { getUser, ISignupData, userSignup } from '../data/user';

export async function signup(context: IContext, data: ISignupData) {
  const signupData = {
    ...data,
  };
  if (signupData.login) {
    const salt = await bcrypt.genSalt();
    signupData.login.password = await bcrypt.hash(signupData.login.password, salt);
  }
  return userSignup(context.sql, data);
}
