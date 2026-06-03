import { createAdminClient } from './supabase'
import type { Match, SafeProfile, PlayerStats, LeaderboardEntry } from '@/types'

const VALID_STATUSES = ['confirmed_appealable', 'locked']

function calcStats(matches: Match[], profileId: string): PlayerStats {
  const played = matches.filter(
    (m) => m.player_a_id === profileId || m.player_b_id === profileId,
  )

  let wins = 0, draws = 0, losses = 0, gs = 0, gc = 0

  for (const m of played) {
    const isA = m.player_a_id === profileId
    const scored = isA ? m.player_a_score : m.player_b_score
    const conceded = isA ? m.player_b_score : m.player_a_score

    gs += scored
    gc += conceded

    if (m.is_draw) {
      draws++
    } else if (m.winner_id === profileId) {
      wins++
    } else {
      losses++
    }
  }

  const total = played.length
  const win_rate = total > 0 ? Math.round((wins / total) * 100) : 0

  // Recent form: last 5 matches, oldest-to-newest
  const sorted = [...played].sort(
    (a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime(),
  )
  const last5 = sorted.slice(-5)
  const recent_form: ('W' | 'D' | 'L')[] = last5.map((m) => {
    if (m.is_draw) return 'D'
    return m.winner_id === profileId ? 'W' : 'L'
  })

  return {
    total,
    wins,
    draws,
    losses,
    goals_scored: gs,
    goals_conceded: gc,
    goal_difference: gs - gc,
    win_rate,
    recent_form,
  }
}

export async function getPlayerStats(profileId: string): Promise<PlayerStats> {
  const db = createAdminClient()
  const { data: matches } = await db
    .from('matches')
    .select('*')
    .in('status', VALID_STATUSES)
    .or(`player_a_id.eq.${profileId},player_b_id.eq.${profileId}`)

  return calcStats((matches ?? []) as Match[], profileId)
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const db = createAdminClient()

  const [{ data: players }, { data: matches }] = await Promise.all([
    db
      .from('profiles')
      .select('id, display_name, nickname, avatar_url, role, status, favorite_team_id, bio, preferred_formation, playing_style, strongest_skill, weak_skill, created_at, updated_at')
      .eq('status', 'active')
      .order('display_name'),
    db.from('matches').select('*').in('status', VALID_STATUSES),
  ])

  const allMatches = (matches ?? []) as Match[]
  const allPlayers = (players ?? []) as SafeProfile[]

  const entries: LeaderboardEntry[] = allPlayers.map((p) => ({
    profile: p,
    stats: calcStats(allMatches, p.id),
    rank: 0,
  }))

  entries.sort((a, b) => {
    if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins
    if (b.stats.goal_difference !== a.stats.goal_difference)
      return b.stats.goal_difference - a.stats.goal_difference
    if (b.stats.goals_scored !== a.stats.goals_scored)
      return b.stats.goals_scored - a.stats.goals_scored
    return a.profile.display_name.localeCompare(b.profile.display_name)
  })

  entries.forEach((e, i) => { e.rank = i + 1 })
  return entries
}
