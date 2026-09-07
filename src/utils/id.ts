import { nanoid } from 'nanoid';

export const createId = (prefix: string): string => `${prefix}_${nanoid(10)}`;
