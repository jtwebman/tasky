import { v7 as uuidV7 } from 'uuid';

/**
 * Generate a UUID v7 for DB IDs and cast it to the correct DB type ID
 * @returns - The ID casted to the correct type
 */
export function generateId<T extends string>(): T {
  return uuidV7() as T;
}
