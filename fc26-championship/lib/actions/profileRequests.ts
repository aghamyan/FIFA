'use server'

import { requireAdmin, canReviewProfileRequest } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/permissions'
import type { ProfileChangePayload } from '@/types'

// ─── Submit a profile change request (player action) ─────────────────────────
export async function submitProfileChangeRequest(changes: ProfileChangePayload) {
  const profile = await requireAuth()

  if (Object.keys(changes).length === 0) {
    return { error: 'No changes provided' }
  }

  const db = createAdminClient()

  // Check for an existing pending request
  const { data: pending } = await db
    .from('profile_change_requests')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('status', 'pending')
    .single()

  if (pending) {
    return { error: 'You already have a pending change request. Wait for it to be reviewed.' }
  }

  const { error } = await db.from('profile_change_requests').insert({
    profile_id: profile.id,
    requested_changes: changes,
  })

  if (error) return { error: `Failed to submit request: ${error.message}` }
  return { success: true }
}

// ─── Review a profile change request (admin action) ───────────────────────────
export async function reviewProfileChangeRequest(
  requestId: string,
  action: 'approved' | 'rejected',
  adminNote?: string,
) {
  const admin = await requireAdmin()

  if (!canReviewProfileRequest(admin)) {
    return { error: 'Insufficient permissions' }
  }

  const db = createAdminClient()

  const { data: req } = await db
    .from('profile_change_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (!req) return { error: 'Request not found' }
  if (req.status !== 'pending') return { error: 'Request is no longer pending' }

  // If approved, apply the changes to the profile
  if (action === 'approved') {
    const allowedFields = [
      'nickname', 'bio', 'preferred_formation',
      'playing_style', 'strongest_skill', 'weak_skill', 'favorite_team_id',
    ]
    const changes = req.requested_changes as Record<string, unknown>
    const safeChanges: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in changes) safeChanges[key] = changes[key]
    }

    if (Object.keys(safeChanges).length > 0) {
      const { error: updateError } = await db
        .from('profiles')
        .update(safeChanges)
        .eq('id', req.profile_id)
      if (updateError) return { error: `Failed to apply changes: ${updateError.message}` }
    }
  }

  const { error } = await db
    .from('profile_change_requests')
    .update({
      status: action,
      admin_note: adminNote ?? null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) return { error: `Failed to update request: ${error.message}` }

  // Notify the player
  await db.from('notifications').insert({
    profile_id: req.profile_id,
    type: 'profile_request_reviewed',
    title: action === 'approved' ? 'Profile update approved' : 'Profile update rejected',
    body: adminNote ?? (action === 'approved' ? 'Your profile has been updated.' : 'Your request was not approved.'),
  })

  return { success: true }
}
