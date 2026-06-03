import { cookies } from 'next/headers'
import { createAdminClient } from './supabase'
import { hashSessionToken, generateSessionToken } from './crypto'
import type { SafeProfile } from '@/types'

const COOKIE_NAME = 'fc26_session'
const SESSION_DURATION_DAYS = 30

export async function createSession(profileId: string): Promise<string> {
  const db = createAdminClient()
  const { token, hash } = generateSessionToken()

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

  const { error } = await db.from('sessions').insert({
    profile_id: profileId,
    token_hash: hash,
    expires_at: expiresAt.toISOString(),
  })

  if (error) throw new Error(`Failed to create session: ${error.message}`)

  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })

  return token
}

export async function getSessionProfile(): Promise<SafeProfile | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null

  const hash = hashSessionToken(token)
  const db = createAdminClient()

  const { data: session } = await db
    .from('sessions')
    .select('profile_id, expires_at')
    .eq('token_hash', hash)
    .single()

  if (!session) return null
  if (new Date(session.expires_at) < new Date()) {
    await deleteSessionByHash(hash)
    return null
  }

  const { data: profile } = await db
    .from('profiles')
    .select(
      'id, display_name, nickname, role, avatar_url, favorite_team_id, bio, preferred_formation, playing_style, strongest_skill, weak_skill, status, created_at, updated_at',
    )
    .eq('id', session.profile_id)
    .single()

  if (!profile || profile.status !== 'active') return null
  return profile as SafeProfile
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value

  if (token) {
    const hash = hashSessionToken(token)
    const db = createAdminClient()
    await db.from('sessions').delete().eq('token_hash', hash)
  }

  store.delete(COOKIE_NAME)
}

async function deleteSessionByHash(hash: string): Promise<void> {
  const db = createAdminClient()
  await db.from('sessions').delete().eq('token_hash', hash)
}
