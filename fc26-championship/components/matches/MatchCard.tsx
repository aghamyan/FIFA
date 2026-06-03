import Link from 'next/link'
import { MatchStatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import type { MatchWithPlayers } from '@/types'

interface MatchCardProps {
  match: MatchWithPlayers
  currentUserId?: string
  compact?: boolean
}

export function MatchCard({ match, currentUserId, compact = false }: MatchCardProps) {
  const isAppealable =
    match.status === 'confirmed_appealable' &&
    new Date(match.appeal_deadline) > new Date()

  const aWon = match.winner_id === match.player_a_id
  const bWon = match.winner_id === match.player_b_id

  const aIsMe = match.player_a_id === currentUserId
  const bIsMe = match.player_b_id === currentUserId

  const playedDate = new Date(match.played_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Link href={`/matches/${match.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="card"
        style={{
          padding: compact ? '0.875rem 1rem' : '1.125rem 1.25rem',
          transition: 'border-color 150ms',
        }}
      >
        {/* Players + Score row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Player A */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Avatar
                name={match.player_a?.display_name ?? '?'}
                avatarUrl={match.player_a?.avatar_url ?? null}
                size="sm"
              />
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: aIsMe ? 700 : 600,
                    fontSize: '0.875rem',
                    color: aWon ? '#f5c842' : '#f0f2fa',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {match.player_a?.display_name ?? 'Unknown'}
                  {aIsMe && <span style={{ color: '#2d8cf0', marginLeft: '0.25rem', fontSize: '0.75rem' }}>(You)</span>}
                </p>
                {match.player_a_team && (
                  <p style={{ fontSize: '0.7rem', color: '#4a5280' }}>{match.player_a_team.short_name ?? match.player_a_team.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Score */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontWeight: 800,
                fontSize: compact ? '1.25rem' : '1.5rem',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span style={{ color: aWon ? '#f5c842' : bWon ? '#8892b0' : '#f0f2fa' }}>
                {match.player_a_score}
              </span>
              <span style={{ color: '#1e2a7a', fontSize: '0.9em' }}>–</span>
              <span style={{ color: bWon ? '#f5c842' : aWon ? '#8892b0' : '#f0f2fa' }}>
                {match.player_b_score}
              </span>
            </div>
            {match.is_draw && (
              <p style={{ fontSize: '0.65rem', color: '#4a5280', marginTop: '0.125rem' }}>DRAW</p>
            )}
          </div>

          {/* Player B */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <div style={{ minWidth: 0, textAlign: 'right' }}>
                <p
                  style={{
                    fontWeight: bIsMe ? 700 : 600,
                    fontSize: '0.875rem',
                    color: bWon ? '#f5c842' : '#f0f2fa',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {bIsMe && <span style={{ color: '#2d8cf0', marginRight: '0.25rem', fontSize: '0.75rem' }}>(You)</span>}
                  {match.player_b?.display_name ?? 'Unknown'}
                </p>
                {match.player_b_team && (
                  <p style={{ fontSize: '0.7rem', color: '#4a5280' }}>{match.player_b_team.short_name ?? match.player_b_team.name}</p>
                )}
              </div>
              <Avatar
                name={match.player_b?.display_name ?? '?'}
                avatarUrl={match.player_b?.avatar_url ?? null}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Footer row */}
        {!compact && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.75rem',
              flexWrap: 'wrap',
              gap: '0.375rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <MatchStatusBadge status={match.status} />
              <span style={{ fontSize: '0.75rem', color: '#4a5280' }}>{playedDate}</span>
            </div>
            {isAppealable && (
              <span style={{ fontSize: '0.72rem', color: '#f5a623' }}>
                Appeal by {new Date(match.appeal_deadline).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
