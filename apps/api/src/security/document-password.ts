import * as crypto from 'node:crypto';

export function hashDocumentPassword(password?: string | null): string | null {
  if (!password?.trim()) return null;
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password.trim(), salt, 100_000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyDocumentPassword(candidate: unknown, passwordHash?: string | null): boolean {
  if (!passwordHash) return true;
  if (typeof candidate !== 'string' || !candidate.trim()) return false;
  const [salt, expectedHash] = passwordHash.split(':');
  if (!salt || !expectedHash) return false;
  const candidateHash = crypto.pbkdf2Sync(candidate.trim(), salt, 100_000, 64, 'sha512').toString('hex');
  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(candidateHash, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
