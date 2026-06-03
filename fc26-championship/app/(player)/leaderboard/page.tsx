import Link from 'next/link'
import { requireAuth } from '@/lib/permissions'
import { getLeaderboard } from '@/lib/stats'
import { Avatar } from '@/components/ui/Avatar'

function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const colors: Record<string, { bg: string; color: string }> = {
    W: { bg: 'rgba(34,168,74,0.15)', color: '#22a84a' },
    D: { bg: 'rgba(255,255,255,0.06)', color: '#8892b0' },
    L: { bg: 'rgba(229,62,62,0.12)', color: '#e53e3e' },
  }
  const { bg, color } = colors[result]
  return (
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: 4,
        background: bg,
        color,
        fontSize: '0.625rem',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {result}
    </span>
  )
}

export default async function LeaderboardPage() {
  await requireAuth()
  const entries = await getLeaderboard()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="page-title">Leaderboard</h1>
        <span style={{ fontSize: '0.75rem', color: '#4a5280' }}>Friendly matches only</span>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <p style={{ fontWeight: 600, color: '#8892b0' }}>No matches yet</p>
          <p style={{ fontSize: '0.875rem' }}>Stats will appear once matches are recorded.</p>
          <Link href="/matches/new" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Record First Match</Link>
        </div>
      ) : (
        <>
          {/* Desktop-style table header */}
          <div
            className="card"
            style={{ padding: '0.625rem 1rem', display: 'none' }}
            aria-hidden
          />

          {/* Ranked cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {entries.map((entry) => (
              <Link
                key={entry.profile.id}
                href={`/player/${entry.profile.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{
                    padding: '1rem 1.125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    borderColor: entry.rank === 1
                      ? 'rgba(245,200,66,0.35)'
                      : entry.rank === 2
                        ? 'rgba(192,192,192,0.25)'
                        : entry.rank === 3
                          ? 'rgba(205,127,50,0.25)'
                          : undefined,
                  }}
                >
                  {/* Rank */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: entry.rank === 1
                        ? 'linear-gradient(135deg,#f5c842,#c49b00)'
                        : entry.rank === 2
                          ? 'linear-gradient(135deg,#c0c0c0,#808080)'
                          : entry.rank === 3
                            ? 'linear-gradient(135deg,#cd7f32,#8b4513)'
                            : '#0d1440',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: entry.rank <= 3 ? '0.875rem' : '0.8125rem',
                      color: entry.rank <= 3 ? '#04071a' : '#8892b0',
                      flexShrink: 0,
                    }}
                  >
                    {entry.rank}
                  </div>

                  {/* Player */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0 }}>
                    <Avatar name={entry.profile.display_name} avatarUrl={entry.profile.avatar_url} size="sm" />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#f0f2fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.profile.display_name}
                      </p>
                      {entry.profile.nickname && (
                        <p style={{ fontSize: '0.75rem', color: '#4ba3f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          &ldquo;{entry.profile.nickname}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '1.25rem', flexShrink: 0 }}>
                    <StatCol label="MP" value={entry.stats.total} />
                    <StatCol label="W" value={entry.stats.wins} highlight={entry.stats.wins > 0} />
                    <StatCol label="D" value={entry.stats.draws} />
                    <StatCol label="L" value={entry.stats.losses} />
                    <StatCol
                      label="GD"
                      value={entry.stats.goal_difference > 0 ? `+${entry.stats.goal_difference}` : String(entry.stats.goal_difference)}
                      highlight={entry.stats.goal_difference > 0}
                      danger={entry.stats.goal_difference < 0}
                    />
                  </div>

                  {/* Recent form */}
                  {entry.stats.recent_form.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                      {entry.stats.recent_form.map((r, i) => (
                        <FormBadge key={i} result={r} />
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Legend */}
          <div className="card" style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', color: '#4a5280', lineHeight: 1.8 }}>
            <span style={{ marginRight: '1rem' }}>MP = Matches Played</span>
            <span style={{ marginRight: '1rem' }}>W = Wins</span>
            <span style={{ marginRight: '1rem' }}>D = Draws</span>
            <span style={{ marginRight: '1rem' }}>L = Losses</span>
            <span>GD = Goal Difference</span>
          </div>
        </>
      )}
    </div>
  )
}

function StatCol({
  label,
  value,
  highlight,
  danger,
}: {
  label: string
  value: number | string
  highlight?: boolean
  danger?: boolean
}) {
  return (
    <div style={{ textAlign: 'center', minWidth: 28 }}>
      <p style={{ fontSize: '0.6875rem', color: '#4a5280', fontWeight: 600, letterSpacing: '0.04em' }}>{label}</p>
      <p
        style={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: highlight ? '#22a84a' : danger ? '#e53e3e' : '#f0f2fa',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>
    </div>
  )
}
