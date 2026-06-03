'use server'

import { requireAuth } from '@/lib/permissions'
import { canRecordFriendlyMatch } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { createNotifications } from '@/lib/notifications'
import type { Match } from '@/types'

// ─── Core match creator — reusable by future tournament logic ─────────────────

interface CreateMatchInput {
  matchType?: string
  playerAId: string
  playerBId: string
  playerAScore: number
  playerBScore: number
  playerATeamId?: string | null
  playerBTeamId?: string | null
  submittedBy: string
  notes?: string | null
  playedAt?: string
}

async function createMatch(input: CreateMatchInput): Promise<string> {
  const db = createAdminClient()

  const isDraw = input.playerAScore === input.playerBScore
  const winnerId = isDraw
    ? null
    : input.playerAScore > input.playerBScore
      ? input.playerAId
      : input.playerBId

  const playedAt = input.playedAt ?? new Date().toISOString()
  // appeal window starts from recording time, not played_at (which may be in the past)
  const appealDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await db
    .from('matches')
    .insert({
      match_type: input.matchType ?? 'friendly',
      player_a_id: input.playerAId,
      player_b_id: input.playerBId,
      player_a_score: input.playerAScore,
      player_b_score: input.playerBScore,
      winner_id: winnerId,
      is_draw: isDraw,
      player_a_team_id: input.playerATeamId ?? null,
      player_b_team_id: input.playerBTeamId ?? null,
      submitted_by: input.submittedBy,
      notes: input.notes ?? null,
      played_at: playedAt,
      appeal_deadline: appealDeadline,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to record match: ${error.message}`)

  await db.from('match_events').insert({
    match_id: data.id,
    event_type: 'match_created',
    actor_id: input.submittedBy,
    metadata: { match_type: input.matchType ?? 'friendly' },
  })

  return data.id
}

// ─── Record friendly match (player action) ────────────────────────────────────

export async function recordFriendlyMatchAction(
  formData: FormData,
): Promise<{ error?: string; matchId?: string }> {
  const profile = await requireAuth()

  if (!canRecordFriendlyMatch(profile)) {
    return { error: 'Your account is not permitted to record matches.' }
  }

  const opponentId = formData.get('opponent_id') as string | null
  const myScoreRaw = formData.get('my_score') as string | null
  const opponentScoreRaw = formData.get('opponent_score') as string | null
  const myTeamId = (formData.get('my_team_id') as string | null) || null
  const opponentTeamId = (formData.get('opponent_team_id') as string | null) || null
  const notes = (formData.get('notes') as string | null)?.trim() || null
  const playedAtRaw = (formData.get('played_at') as string | null)?.trim() || null

  if (!opponentId) return { error: 'Please select an opponent.' }
  if (opponentId === profile.id) return { error: 'You cannot record a match against yourself.' }
  if (myScoreRaw === null || myScoreRaw === '') return { error: 'Please enter your score.' }
  if (opponentScoreRaw === null || opponentScoreRaw === '') return { error: 'Please enter opponent score.' }

  const myScore = parseInt(myScoreRaw, 10)
  const opponentScore = parseInt(opponentScoreRaw, 10)

  if (isNaN(myScore) || myScore < 0) return { error: 'Your score must be a non-negative number.' }
  if (isNaN(opponentScore) || opponentScore < 0) return { error: 'Opponent score must be a non-negative number.' }

  const db = createAdminClient()

  const { data: opponent } = await db
    .from('profiles')
    .select('id, display_name, status')
    .eq('id', opponentId)
    .single()

  if (!opponent) return { error: 'Opponent not found.' }
  if (opponent.status !== 'active') return { error: 'That player is not active.' }

  let playedAt: string | undefined
  if (playedAtRaw) {
    const parsed = new Date(playedAtRaw)
    if (isNaN(parsed.getTime())) return { error: 'Invalid date/time for played at.' }
    if (parsed > new Date()) return { error: 'Played date cannot be in the future.' }
    playedAt = parsed.toISOString()
  }

  let matchId: string
  try {
    matchId = await createMatch({
      matchType: 'friendly',
      playerAId: profile.id,
      playerBId: opponentId,
      playerAScore: myScore,
      playerBScore: opponentScore,
      playerATeamId: myTeamId,
      playerBTeamId: opponentTeamId,
      submittedBy: profile.id,
      notes,
      playedAt,
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to record match.' }
  }

  const isDraw = myScore === opponentScore
  const iWon = !isDraw && myScore > opponentScore
  const resultLine = isDraw
    ? `${myScore}–${opponentScore} (Draw)`
    : iWon
      ? `${myScore}–${opponentScore} (Win)`
      : `${myScore}–${opponentScore} (Loss)`

  await createNotifications([
    {
      profileId: profile.id,
      type: 'match_recorded',
      title: 'Match result submitted',
      body: `vs ${opponent.display_name} — ${resultLine}. Appealable for 24 hours.`,
      matchId,
    },
    {
      profileId: opponentId,
      type: 'match_recorded',
      title: 'A result was recorded against you',
      body: `${profile.display_name} recorded a match: ${resultLine}. Appealable for 24 hours.`,
      matchId,
    },
  ])

  return { matchId }
}

// ─── Lock expired matches ─────────────────────────────────────────────────────

export async function lockExpiredMatches(): Promise<{ locked: number }> {
  const db = createAdminClient()
  const now = new Date().toISOString()

  // Drive events/notifications off the rows actually transitioned by the UPDATE,
  // not a prior SELECT, so concurrent calls never double-insert for the same match.
  const { data: transitioned } = await db
    .from('matches')
    .update({ status: 'locked', locked_at: now })
    .eq('status', 'confirmed_appealable')
    .lt('appeal_deadline', now)
    .select('id, player_a_id, player_b_id')

  if (!transitioned || transitioned.length === 0) return { locked: 0 }

  const locked = transitioned as Array<{ id: string; player_a_id: string; player_b_id: string }>

  await db.from('match_events').insert(
    locked.map((m) => ({
      match_id: m.id,
      event_type: 'match_locked',
      metadata: { auto_locked: true },
    })),
  )

  await createNotifications(
    locked.flatMap((m) => [
      {
        profileId: m.player_a_id,
        type: 'match_locked',
        title: 'Match result locked',
        body: 'The 24-hour appeal window has closed. This result is now confirmed.',
        matchId: m.id,
      },
      {
        profileId: m.player_b_id,
        type: 'match_locked',
        title: 'Match result locked',
        body: 'The 24-hour appeal window has closed. This result is now confirmed.',
        matchId: m.id,
      },
    ]),
  )

  return { locked: locked.length }
}

// ─── Fetch helpers (server-side, not server actions) ──────────────────────────

export async function getMatchWithPlayers(matchId: string) {
  const db = createAdminClient()

  const { data: match } = await db
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single()

  if (!match) return null

  const m = match as Match

  const playerIds = [...new Set([m.player_a_id, m.player_b_id, m.submitted_by])]
  const { data: profiles } = await db
    .from('profiles')
    .select('id, display_name, nickname, avatar_url, role, status, favorite_team_id, bio, preferred_formation, playing_style, strongest_skill, weak_skill, created_at, updated_at')
    .in('id', playerIds)

  const teamIds = [m.player_a_team_id, m.player_b_team_id].filter(Boolean) as string[]
  const { data: teams } = teamIds.length
    ? await db.from('fc_teams').select('id, name, short_name, logo_url, created_at').in('id', teamIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
  const teamMap = Object.fromEntries((teams ?? []).map((t) => [t.id, t]))

  return {
    ...m,
    player_a: profileMap[m.player_a_id] ?? null,
    player_b: profileMap[m.player_b_id] ?? null,
    player_a_team: m.player_a_team_id ? teamMap[m.player_a_team_id] ?? null : null,
    player_b_team: m.player_b_team_id ? teamMap[m.player_b_team_id] ?? null : null,
    submitted_by_profile: profileMap[m.submitted_by] ?? null,
  }
}

export async function getMatchesWithPlayers(filters?: {
  playerIdFilter?: string
  myId?: string
  matchType?: string
  status?: string
}) {
  const db = createAdminClient()

  let query = db.from('matches').select('*').order('played_at', { ascending: false }).limit(100)

  if (filters?.myId && !filters.playerIdFilter) {
    query = query.or(`player_a_id.eq.${filters.myId},player_b_id.eq.${filters.myId}`)
  } else if (filters?.playerIdFilter) {
    query = query.or(`player_a_id.eq.${filters.playerIdFilter},player_b_id.eq.${filters.playerIdFilter}`)
  }

  if (filters?.matchType) query = query.eq('match_type', filters.matchType)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data: rawMatches } = await query
  const matches = (rawMatches ?? []) as Match[]

  if (matches.length === 0) return []

  const playerIds = [...new Set(matches.flatMap((m) => [m.player_a_id, m.player_b_id]))]
  const teamIds = [...new Set(matches.flatMap((m) => [m.player_a_team_id, m.player_b_team_id]).filter(Boolean))] as string[]

  const [{ data: profiles }, { data: teams }] = await Promise.all([
    db
      .from('profiles')
      .select('id, display_name, nickname, avatar_url, role, status, favorite_team_id, bio, preferred_formation, playing_style, strongest_skill, weak_skill, created_at, updated_at')
      .in('id', playerIds),
    teamIds.length
      ? db.from('fc_teams').select('id, name, short_name, logo_url, created_at').in('id', teamIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
  const teamMap = Object.fromEntries((teams ?? []).map((t) => [t.id, t]))

  return matches.map((m) => ({
    ...m,
    player_a: profileMap[m.player_a_id] ?? null,
    player_b: profileMap[m.player_b_id] ?? null,
    player_a_team: m.player_a_team_id ? teamMap[m.player_a_team_id] ?? null : null,
    player_b_team: m.player_b_team_id ? teamMap[m.player_b_team_id] ?? null : null,
  }))
}

