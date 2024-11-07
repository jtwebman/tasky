import { v7 as uuidV7 } from 'uuid';

export function generateId<T extends string>(): T {
  return uuidV7() as T;
}
