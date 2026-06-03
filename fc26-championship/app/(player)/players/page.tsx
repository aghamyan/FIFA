import Link from 'next/link'
import { requireAuth } from '@/lib/permissions'
import { getLeaderboard } from '@/lib/stats'
import { Avatar } from '@/components/ui/Avatar'

export default async function PlayersPage() {
  await requireAuth()

  const entries = await getLeaderboard()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h1 className="page-title">Players</h1>

      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p style={{ fontWeight: 600, color: '#8892b0' }}>No active players</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
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
                }}
              >
                <Avatar name={entry.profile.display_name} avatarUrl={entry.profile.avatar_url} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#f0f2fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.profile.display_name}
                  </p>
                  {entry.profile.nickname && (
                    <p style={{ fontSize: '0.8125rem', color: '#4ba3f5' }}>&ldquo;{entry.profile.nickname}&rdquo;</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.65rem', color: '#4a5280', fontWeight: 600 }}>W</p>
                    <p style={{ fontWeight: 700, color: entry.stats.wins > 0 ? '#22a84a' : '#8892b0' }}>{entry.stats.wins}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.65rem', color: '#4a5280', fontWeight: 600 }}>MP</p>
                    <p style={{ fontWeight: 700, color: '#8892b0' }}>{entry.stats.total}</p>
                  </div>
                </div>
                <span style={{ color: '#4a5280', fontSize: '1rem', flexShrink: 0 }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
