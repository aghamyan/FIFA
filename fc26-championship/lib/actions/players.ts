'use server'

import { redirect } from 'next/navigation'
import { requireAdmin, canManagePlayer, canAssignRole } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { hashAccessCode } from '@/lib/crypto'
import type { Role, ProfileStatus } from '@/types'

// ─── Create player ────────────────────────────────────────────────────────────
export async function createPlayerAction(formData: FormData) {
  const admin = await requireAdmin()
  const db = createAdminClient()

  const displayName = (formData.get('display_name') as string | null)?.trim()
  const nickname    = (formData.get('nickname')      as string | null)?.trim() || null
  const role        = (formData.get('role')          as Role | null)          ?? 'player'
  const accessCode  = (formData.get('access_code')   as string | null)?.trim()

  if (!displayName) return { error: 'Display name is required' }
  if (!accessCode)  return { error: 'Access code is required' }
  if (!canAssignRole(admin, role)) {
    return { error: 'You do not have permission to assign this role' }
  }

  // Ensure access code is unique
  const { data: existing } = await db.from('profiles').select('access_code_hash')
  const bcrypt = await import('bcryptjs')
  if (existing) {
    for (const p of existing) {
      if (await bcrypt.compare(accessCode, p.access_code_hash)) {
        return { error: 'Access code is already in use' }
      }
    }
  }

  const hash = await hashAccessCode(accessCode)

  const { data, error } = await db
    .from('profiles')
    .insert({ display_name: displayName, nickname, role, access_code_hash: hash, status: 'active' })
    .select('id')
    .single()

  if (error) return { error: `Failed to create player: ${error.message}` }

  redirect(`/admin/players/${data.id}`)
}

// ─── Update player ────────────────────────────────────────────────────────────
export async function updatePlayerAction(targetId: string, formData: FormData) {
  const admin = await requireAdmin()
  const db = createAdminClient()

  const { data: target } = await db
    .from('profiles')
    .select('id, role, status, display_name, nickname, access_code_hash')
    .eq('id', targetId)
    .single()

  if (!target) return { error: 'Player not found' }
  if (!canManagePlayer(admin, target as unknown as Parameters<typeof canManagePlayer>[1])) {
    return { error: 'You do not have permission to edit this player' }
  }

  const displayName = (formData.get('display_name') as string | null)?.trim()
  const nickname    = (formData.get('nickname')      as string | null)?.trim() || null
  const status      = formData.get('status')        as ProfileStatus | null
  const role        = formData.get('role')          as Role | null
  const newCode     = (formData.get('access_code')  as string | null)?.trim()

  const updates: Record<string, unknown> = {}
  if (displayName) updates.display_name = displayName
  updates.nickname = nickname

  if (status && ['active', 'inactive', 'restricted'].includes(status)) {
    updates.status = status
  }
  if (role && canAssignRole(admin, role)) {
    updates.role = role
  }

  if (newCode) {
    // Check uniqueness excluding this profile
    const { data: others } = await db
      .from('profiles')
      .select('access_code_hash')
      .neq('id', targetId)

    const bcrypt = await import('bcryptjs')
    if (others) {
      for (const p of others) {
        if (await bcrypt.compare(newCode, p.access_code_hash)) {
          return { error: 'Access code is already in use' }
        }
      }
    }
    updates.access_code_hash = await hashAccessCode(newCode)
  }

  const { error } = await db.from('profiles').update(updates).eq('id', targetId)
  if (error) return { error: `Update failed: ${error.message}` }

  return { success: true }
}
