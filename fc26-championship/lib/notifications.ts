import { createAdminClient } from './supabase'

interface CreateNotificationInput {
  profileId: string
  type: string
  title: string
  body?: string
  matchId?: string
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const db = createAdminClient()
  await db.from('notifications').insert({
    profile_id: input.profileId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    match_id: input.matchId ?? null,
  })
}

export async function createNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  if (inputs.length === 0) return
  const db = createAdminClient()
  await db.from('notifications').insert(
    inputs.map((n) => ({
      profile_id: n.profileId,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      match_id: n.matchId ?? null,
    })),
  )
}
