'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/permissions'
import { canCommentOnMatch, canDeleteComment } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { createNotifications } from '@/lib/notifications'
import type { Match } from '@/types'

export async function addCommentAction(
  matchId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const profile = await requireAuth()

  if (!canCommentOnMatch(profile)) {
    return { error: 'Your account is not permitted to comment.' }
  }

  const body = (formData.get('body') as string | null)?.trim()
  if (!body) return { error: 'Comment cannot be empty.' }

  const db = createAdminClient()

  const { data: match } = await db
    .from('matches')
    .select('id, player_a_id, player_b_id')
    .eq('id', matchId)
    .single()

  if (!match) return { error: 'Match not found.' }

  const m = match as Pick<Match, 'id' | 'player_a_id' | 'player_b_id'>

  const { error } = await db.from('match_comments').insert({
    match_id: matchId,
    author_id: profile.id,
    body,
  })

  if (error) return { error: `Failed to post comment: ${error.message}` }

  await db.from('match_events').insert({
    match_id: matchId,
    event_type: 'comment_added',
    actor_id: profile.id,
  })

  // Notify both match participants, but not the commenter
  const recipients = [m.player_a_id, m.player_b_id].filter((id) => id !== profile.id)
  if (recipients.length > 0) {
    await createNotifications(
      recipients.map((pid) => ({
        profileId: pid,
        type: 'comment_added',
        title: `${profile.display_name} commented on your match`,
        body: body.slice(0, 80) + (body.length > 80 ? '…' : ''),
        matchId,
      })),
    )
  }

  revalidatePath(`/matches/${matchId}`)
  return {}
}

export async function deleteCommentAction(
  commentId: string,
): Promise<{ error?: string }> {
  const profile = await requireAuth()
  const db = createAdminClient()

  const { data: comment } = await db
    .from('match_comments')
    .select('id, author_id, match_id')
    .eq('id', commentId)
    .single()

  if (!comment) return { error: 'Comment not found.' }
  if (!canDeleteComment(profile, comment)) {
    return { error: 'You are not allowed to delete this comment.' }
  }

  await db.from('match_comments').update({ is_deleted: true }).eq('id', commentId)

  revalidatePath(`/matches/${comment.match_id}`)
  return {}
}
