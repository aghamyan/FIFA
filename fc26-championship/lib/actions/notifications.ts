'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'

export async function markNotificationReadAction(
  notificationId: string,
): Promise<{ error?: string }> {
  const profile = await requireAuth()
  const db = createAdminClient()

  const { error } = await db
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('profile_id', profile.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}

export async function markAllNotificationsReadAction(): Promise<{ error?: string }> {
  const profile = await requireAuth()
  const db = createAdminClient()

  const { error } = await db
    .from('notifications')
    .update({ is_read: true })
    .eq('profile_id', profile.id)
    .eq('is_read', false)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}
