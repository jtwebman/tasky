import { IContext } from '../context';
import { IDataUser, insertUser } from '../data/user';

export function signup(context: IContext, data: Omit<IDataUser, 'id'>) {
  return insertUser(context, data);
}
