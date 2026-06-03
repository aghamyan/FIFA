import Link from 'next/link'
import { requireAuth } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { lockExpiredMatches, getMatchesWithPlayers } from '@/lib/actions/matches'
import { getPlayerStats } from '@/lib/stats'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge } from '@/components/ui/Badge'
import { MatchCard } from '@/components/matches/MatchCard'
import { MarkAllReadButton } from './MarkAllReadButton'
import type { Notification } from '@/types'

export default async function DashboardPage() {
  const profile = await requireAuth()
  await lockExpiredMatches()

  const db = createAdminClient()

  const [
    { data: notifications },
    { data: pendingReq },
    stats,
    recentMatchesRaw,
  ] = await Promise.all([
    db
      .from('notifications')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10),
    db
      .from('profile_change_requests')
      .select('id, status, created_at')
      .eq('profile_id', profile.id)
      .eq('status', 'pending')
      .maybeSingle(),
    getPlayerStats(profile.id),
    getMatchesWithPlayers({ myId: profile.id }),
  ])

  const recentMatches = recentMatchesRaw.slice(0, 3)

  const appealableMatches = recentMatchesRaw.filter(
    (m) =>
      m.status === 'confirmed_appealable' &&
      new Date(m.appeal_deadline) > new Date(),
  )

  const unreadNotifications = (notifications ?? []).filter((n: Notification) => !n.is_read)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Welcome card */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #0d1440 0%, #141d5c 100%)',
          borderColor: 'rgba(45,140,240,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href={`/player/${profile.id}`} style={{ textDecoration: 'none' }}>
            <Avatar name={profile.display_name} avatarUrl={profile.avatar_url} size="lg" />
          </Link>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.8125rem', color: '#8892b0', marginBottom: '0.125rem' }}>Welcome back</p>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#f0f2fa', letterSpacing: '-0.02em' }}>
              {profile.display_name}
            </h2>
            {profile.nickname && (
              <p style={{ fontSize: '0.875rem', color: '#4ba3f5' }}>&ldquo;{profile.nickname}&rdquo;</p>
            )}
            <div style={{ marginTop: '0.5rem' }}>
              <RoleBadge role={profile.role} />
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        {stats.total > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
              marginTop: '1.25rem',
            }}
          >
            {[
              { label: 'Played', value: stats.total },
              { label: 'Wins', value: stats.wins, color: '#22a84a' },
              { label: 'GD', value: stats.goal_difference > 0 ? `+${stats.goal_difference}` : stats.goal_difference },
              { label: 'Win%', value: `${stats.win_rate}%` },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  padding: '0.625rem',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '0.65rem', color: '#4a5280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 800, color: (s as { color?: string }).color ?? '#f0f2fa', fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending request notice */}
      {pendingReq && (
        <div
          className="card"
          style={{ padding: '1rem 1.25rem', borderColor: 'rgba(245,166,35,0.3)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          <span style={{ fontSize: '1.25rem' }}>⏳</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f5a623', marginBottom: '0.125rem' }}>
              Profile change pending
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#4a5280' }}>
              Your profile update is waiting for admin review.
            </p>
          </div>
        </div>
      )}

      {/* Appealable matches alert */}
      {appealableMatches.length > 0 && (
        <div
          className="card"
          style={{ padding: '1rem 1.25rem', borderColor: 'rgba(245,166,35,0.3)' }}
        >
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f5a623', marginBottom: '0.625rem' }}>
            ⏱ {appealableMatches.length} match{appealableMatches.length > 1 ? 'es' : ''} appealable
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {appealableMatches.slice(0, 2).map((m) => (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                style={{ textDecoration: 'none', fontSize: '0.8125rem', color: '#8892b0', display: 'flex', justifyContent: 'space-between' }}
              >
                <span>
                  {m.player_a?.display_name ?? '?'} vs {m.player_b?.display_name ?? '?'} — {m.player_a_score}–{m.player_b_score}
                </span>
                <span style={{ color: '#f5a623', fontSize: '0.75rem' }}>
                  until {new Date(m.appeal_deadline).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Link href="/matches/new" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚽</div>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f0f2fa' }}>Record Match</p>
            <p style={{ fontSize: '0.8rem', color: '#4a5280', marginTop: '0.25rem' }}>Log a friendly</p>
          </div>
        </Link>
        <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🏆</div>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f0f2fa' }}>Leaderboard</p>
            <p style={{ fontSize: '0.8rem', color: '#4a5280', marginTop: '0.25rem' }}>See rankings</p>
          </div>
        </Link>
      </div>

      {/* Recent matches */}
      {recentMatches.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <p className="section-title">Recent Matches</p>
            <Link href="/matches?filter=my" style={{ fontSize: '0.8125rem', color: '#2d8cf0', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recentMatches.map((m) => (
              <MatchCard key={m.id} match={m as Parameters<typeof MatchCard>[0]['match']} currentUserId={profile.id} compact />
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {(notifications ?? []).length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <p className="section-title">Notifications</p>
            {unreadNotifications.length > 0 && <MarkAllReadButton />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(notifications ?? []).map((n: Notification) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <Link
      href={notification.match_id ? `/matches/${notification.match_id}` : '/matches'}
      style={{ textDecoration: 'none' }}
    >
      <div
        className="card-inner"
        style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          gap: '0.75rem',
          opacity: notification.is_read ? 0.55 : 1,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: notification.is_read ? '#1e2a7a' : '#2d8cf0',
            flexShrink: 0,
            marginTop: '0.375rem',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f0f2fa', marginBottom: '0.125rem' }}>
            {notification.title}
          </p>
          {notification.body && (
            <p style={{ fontSize: '0.8125rem', color: '#8892b0', lineHeight: 1.5 }}>{notification.body}</p>
          )}
          <p style={{ fontSize: '0.75rem', color: '#4a5280', marginTop: '0.25rem' }}>
            {new Date(notification.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </Link>
  )
}
