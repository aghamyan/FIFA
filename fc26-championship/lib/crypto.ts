import bcrypt from 'bcryptjs'
import { createHmac, randomBytes } from 'crypto'

const BCRYPT_ROUNDS = 12

// ─── Access codes ─────────────────────────────────────────────────────────────

export async function hashAccessCode(code: string): Promise<string> {
  return bcrypt.hash(code, BCRYPT_ROUNDS)
}

export async function verifyAccessCode(
  code: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(code, hash)
}

// ─── Session tokens ───────────────────────────────────────────────────────────

// Generates a cryptographically random session token.
// Returns the raw token (put in cookie) and its HMAC-SHA256 hash (store in DB).
export function generateSessionToken(): { token: string; hash: string } {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')

  const token = randomBytes(32).toString('hex')
  const hash = hmacSha256(token, secret)
  return { token, hash }
}

export function hashSessionToken(token: string): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return hmacSha256(token, secret)
}

function hmacSha256(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex')
}
