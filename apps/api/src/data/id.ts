import { v7 as uuidV7 } from 'uuid';

export type ID = string;

export function generateId(): ID {
  return uuidV7();
}
