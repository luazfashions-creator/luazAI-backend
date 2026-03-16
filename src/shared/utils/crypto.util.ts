import { randomBytes, createHash } from 'crypto';

export function generateRandomToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

export function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
