// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import type { UsersId } from './Users';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.logins */
export type LoginsId = string & { __brand: 'LoginsId' };

/** Represents the table public.logins */
export default interface LoginsTable {
  id: ColumnType<LoginsId, LoginsId, LoginsId>;

  userId: ColumnType<UsersId, UsersId, UsersId>;

  username: ColumnType<string, string, string>;

  password: ColumnType<string | null, string | null, string | null>;

  createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

  updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type Logins = Selectable<LoginsTable>;

export type NewLogins = Insertable<LoginsTable>;

export type LoginsUpdate = Updateable<LoginsTable>;
