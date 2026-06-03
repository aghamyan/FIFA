import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { getPlayerStats } from '@/lib/stats'
import { getMatchesWithPlayers } from '@/lib/actions/matches'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { MatchCard } from '@/components/matches/MatchCard'
import type { SafeProfile, FcTeam } from '@/types'

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const currentProfile = await requireAuth()
  const db = createAdminClient()

  const { data: player } = await db
    .from('profiles')
    .select('id, display_name, nickname, avatar_url, role, status, favorite_team_id, bio, preferred_formation, playing_style, strongest_skill, weak_skill, created_at, updated_at')
    .eq('id', id)
    .single()

  if (!player) notFound()

  const profile = player as SafeProfile

  // Redirect to own profile page if viewing self
  // (still show this page — it works for self too)

  const [stats, recentMatchesRaw] = await Promise.all([
    getPlayerStats(id),
    getMatchesWithPlayers({ playerIdFilter: id }),
  ])

  const recentMatches = recentMatchesRaw.slice(0, 5)

  let team: FcTeam | null = null
  if (profile.favorite_team_id) {
    const { data } = await db.from('fc_teams').select('*').eq('id', profile.favorite_team_id).single()
    team = data
  }

  const isOwnProfile = id === currentProfile.id

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link href="/players" style={{ color: '#4a5280', textDecoration: 'none', fontSize: '1.25rem' }}>←</Link>
        <h1 className="page-title">
          {isOwnProfile ? 'Your Profile' : profile.display_name}
        </h1>
      </div>

      {/* Profile card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Avatar name={profile.display_name} avatarUrl={profile.avatar_url} size="xl" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#f0f2fa', marginBottom: '0.25rem' }}>
              {profile.display_name}
            </h2>
            {profile.nickname && (
              <p style={{ color: '#4ba3f5', fontWeight: 500, marginBottom: '0.5rem' }}>
                &ldquo;{profile.nickname}&rdquo;
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
              <RoleBadge role={profile.role} />
              <StatusBadge status={profile.status} />
            </div>
            {profile.bio && (
              <p style={{ fontSize: '0.875rem', color: '#8892b0', lineHeight: 1.6 }}>{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Football info */}
        {(team || profile.preferred_formation || profile.playing_style || profile.strongest_skill) && (
          <>
            <hr className="divider" style={{ margin: '1rem 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {team && <FieldRow label="Fav. Team" value={team.name} />}
              {profile.preferred_formation && <FieldRow label="Formation" value={profile.preferred_formation} />}
              {profile.playing_style && <FieldRow label="Style" value={profile.playing_style} />}
              {profile.strongest_skill && <FieldRow label="Best at" value={profile.strongest_skill} />}
              {profile.weak_skill && <FieldRow label="Weak at" value={profile.weak_skill} />}
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <p className="section-title" style={{ marginBottom: '0.875rem' }}>Career Stats</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          <StatBox label="Matches" value={stats.total} />
          <StatBox label="Wins" value={stats.wins} color="#22a84a" />
          <StatBox label="Draws" value={stats.draws} color="#8892b0" />
          <StatBox label="Losses" value={stats.losses} color="#e53e3e" />
          <StatBox label="Goal Diff" value={stats.goal_difference > 0 ? `+${stats.goal_difference}` : stats.goal_difference} />
          <StatBox label="Win Rate" value={`${stats.win_rate}%`} color={stats.win_rate >= 50 ? '#22a84a' : undefined} />
        </div>

        {stats.recent_form.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#4a5280', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Recent Form</p>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {stats.recent_form.map((r, i) => {
                const colorMap: Record<string, string> = { W: '#22a84a', D: '#8892b0', L: '#e53e3e' }
                return (
                  <span
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: r === 'W' ? 'rgba(34,168,74,0.15)' : r === 'D' ? 'rgba(255,255,255,0.06)' : 'rgba(229,62,62,0.12)',
                      color: colorMap[r],
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {r}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent matches */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <p className="section-title">Recent Matches</p>
          <Link href={`/player/${id}/matches`} style={{ fontSize: '0.8125rem', color: '#2d8cf0', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
        {recentMatches.length === 0 ? (
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: '#4a5280', fontSize: '0.875rem' }}>
            No matches played yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recentMatches.map((m) => (
              <MatchCard key={m.id} match={m as Parameters<typeof MatchCard>[0]['match']} currentUserId={currentProfile.id} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
      <span style={{ minWidth: 80, fontSize: '0.75rem', fontWeight: 600, color: '#4a5280', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: '#f0f2fa' }}>{value}</span>
    </div>
  )
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string
  value: number | string
  color?: string
}) {
  return (
    <div className="card-inner" style={{ padding: '0.75rem', textAlign: 'center' }}>
      <p style={{ fontSize: '0.7rem', color: '#4a5280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.375rem', fontWeight: 800, color: color ?? '#f0f2fa', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
    </div>
  )
}
