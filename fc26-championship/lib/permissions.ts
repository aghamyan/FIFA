import { redirect } from 'next/navigation'
import { getSessionProfile } from './session'
import type { SafeProfile, Role, Match, MatchComment } from '@/types'

// ─── Auth guards (call from server components / route handlers) ───────────────

export async function requireAuth(): Promise<SafeProfile> {
  const profile = await getSessionProfile()
  if (!profile) redirect('/login')
  return profile
}

export async function requireAdmin(): Promise<SafeProfile> {
  const profile = await requireAuth()
  if (profile.role !== 'super_admin' && profile.role !== 'moderator') {
    redirect('/dashboard')
  }
  return profile
}

export async function requireSuperAdmin(): Promise<SafeProfile> {
  const profile = await requireAuth()
  if (profile.role !== 'super_admin') redirect('/dashboard')
  return profile
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_RANK: Record<Role, number> = {
  player: 0,
  moderator: 1,
  super_admin: 2,
}

export function isAdmin(profile: SafeProfile): boolean {
  return profile.role === 'super_admin' || profile.role === 'moderator'
}

// ─── Player management ────────────────────────────────────────────────────────

export function canManagePlayer(
  current: SafeProfile,
  target: SafeProfile,
): boolean {
  if (current.role === 'player') return false
  if (current.role === 'moderator' && target.role !== 'player') return false
  return true
}

export function canAssignRole(current: SafeProfile, role: Role): boolean {
  return ROLE_RANK[current.role] > ROLE_RANK[role]
}

export function canReviewProfileRequest(current: SafeProfile): boolean {
  return current.role === 'super_admin' || current.role === 'moderator'
}

export function canCreatePlayer(current: SafeProfile): boolean {
  return current.role === 'super_admin' || current.role === 'moderator'
}

// ─── Match permissions ────────────────────────────────────────────────────────

export function canRecordFriendlyMatch(current: SafeProfile): boolean {
  return current.status === 'active'
}

export function canViewMatch(_current: SafeProfile, _match: Match): boolean {
  return true
}

export function canCommentOnMatch(current: SafeProfile): boolean {
  return current.status === 'active'
}

export function canDeleteComment(
  current: SafeProfile,
  comment: Pick<MatchComment, 'author_id'>,
): boolean {
  if (current.role === 'super_admin' || current.role === 'moderator') return true
  return comment.author_id === current.id
}

export function canLockExpiredMatches(current: SafeProfile): boolean {
  return current.role === 'super_admin' || current.role === 'moderator'
}
