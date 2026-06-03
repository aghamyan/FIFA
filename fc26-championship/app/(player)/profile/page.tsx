import Link from 'next/link'
import { requireAuth } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { getPlayerStats } from '@/lib/stats'
import { getMatchesWithPlayers } from '@/lib/actions/matches'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { MatchCard } from '@/components/matches/MatchCard'
import type { FcTeam } from '@/types'

export default async function ProfilePage() {
  const profile = await requireAuth()
  const db = createAdminClient()

  const [team, changeRequests, stats, recentMatchesRaw] = await Promise.all([
    profile.favorite_team_id
      ? db.from('fc_teams').select('*').eq('id', profile.favorite_team_id).single().then((r) => r.data as FcTeam | null)
      : Promise.resolve(null),
    db
      .from('profile_change_requests')
      .select('id, status, created_at, admin_note')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then((r) => r.data),
    getPlayerStats(profile.id),
    getMatchesWithPlayers({ myId: profile.id }),
  ])

  const recentMatches = recentMatchesRaw.slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.125rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Avatar name={profile.display_name} avatarUrl={profile.avatar_url} size="xl" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.375rem', color: '#f0f2fa', marginBottom: '0.25rem' }}>
              {profile.display_name}
            </h2>
            {profile.nickname && (
              <p style={{ color: '#4ba3f5', fontWeight: 500, marginBottom: '0.5rem' }}>
                &ldquo;{profile.nickname}&rdquo;
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <RoleBadge role={profile.role} />
              <StatusBadge status={profile.status} />
            </div>
            {profile.bio && (
              <p style={{ fontSize: '0.875rem', color: '#8892b0', lineHeight: 1.65 }}>{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <p className="section-title" style={{ marginBottom: '0.875rem' }}>Your Stats</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
            {[
              { label: 'Matches', value: stats.total },
              { label: 'Wins', value: stats.wins, color: '#22a84a' },
              { label: 'Draws', value: stats.draws },
              { label: 'Losses', value: stats.losses, color: '#e53e3e' },
              { label: 'Goals', value: `${stats.goals_scored}` },
              { label: 'Win%', value: `${stats.win_rate}%`, color: stats.win_rate >= 50 ? '#22a84a' : undefined },
            ].map((s) => (
              <div key={s.label} className="card-inner" style={{ padding: '0.625rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.65rem', color: '#4a5280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 800, color: (s as { color?: string }).color ?? '#f0f2fa', fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
              </div>
            ))}
          </div>
          {stats.recent_form.length > 0 && (
            <div style={{ marginTop: '0.875rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#4a5280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.375rem' }}>Recent Form</p>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {stats.recent_form.map((r, i) => (
                  <span
                    key={i}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 5,
                      background: r === 'W' ? 'rgba(34,168,74,0.15)' : r === 'D' ? 'rgba(255,255,255,0.06)' : 'rgba(229,62,62,0.12)',
                      color: r === 'W' ? '#22a84a' : r === 'D' ? '#8892b0' : '#e53e3e',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Football info */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <p className="section-title" style={{ marginBottom: '1rem' }}>Football Profile</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {team && <ProfileField label="Favorite Team" value={team.name} />}
          {profile.preferred_formation && <ProfileField label="Formation" value={profile.preferred_formation} />}
          {profile.playing_style && <ProfileField label="Playing Style" value={profile.playing_style} />}
          {profile.strongest_skill && <ProfileField label="Strongest Skill" value={profile.strongest_skill} />}
          {profile.weak_skill && <ProfileField label="Weak Skill" value={profile.weak_skill} />}
          {!team && !profile.preferred_formation && !profile.playing_style && !profile.strongest_skill && !profile.weak_skill && (
            <p style={{ fontSize: '0.875rem', color: '#4a5280', fontStyle: 'italic' }}>
              No football details set yet. Request a profile update to add them.
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        <Link href="/profile/edit-request" className="btn btn-primary btn-full">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Request Profile Update
        </Link>
        <Link href={`/player/${profile.id}/matches`} className="btn btn-ghost btn-full">
          View Full Match History
        </Link>
      </div>

      {/* Recent matches */}
      {recentMatches.length > 0 && (
        <div>
          <p className="section-title" style={{ marginBottom: '0.75rem' }}>Recent Matches</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recentMatches.map((m) => (
              <MatchCard key={m.id} match={m as Parameters<typeof MatchCard>[0]['match']} currentUserId={profile.id} compact />
            ))}
          </div>
        </div>
      )}

      {/* Change request history */}
      {(changeRequests ?? []).length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <p className="section-title" style={{ marginBottom: '0.75rem' }}>Recent Requests</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(changeRequests ?? []).map((req) => (
              <div key={req.id} className="card-inner" style={{ padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: req.admin_note ? '0.375rem' : 0 }}>
                  <span style={{ fontSize: '0.8125rem', color: '#8892b0' }}>
                    {new Date(req.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span className={`badge ${req.status === 'approved' ? 'badge-green' : req.status === 'rejected' ? 'badge-red' : 'badge-orange'}`}>
                    {req.status}
                  </span>
                </div>
                {req.admin_note && (
                  <p style={{ fontSize: '0.8125rem', color: '#4a5280', fontStyle: 'italic' }}>{req.admin_note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
      <span style={{ minWidth: 120, fontSize: '0.75rem', fontWeight: 600, color: '#4a5280', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: '0.9rem', color: '#f0f2fa' }}>{value}</span>
    </div>
  )
}
