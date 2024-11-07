import bcrypt from 'bcrypt';
import { IContext } from '../context';
import { getUser, ISignupData, userSignup } from '../data/user';

export function signup(context: IContext, data: ISignupData) {
  return context.sql.begin(async (tx) => {
    const signupData = {
      ...data,
    };
    if (signupData.login) {
      const salt = await bcrypt.genSalt();
      signupData.login.password = await bcrypt.hash(signupData.login.password, salt);
    }
    const userId = await userSignup(tx, data);
    return getUser(tx, userId);
  });
}
