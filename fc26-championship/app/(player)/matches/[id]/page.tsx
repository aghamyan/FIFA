import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/permissions'
import { getMatchWithPlayers, lockExpiredMatches } from '@/lib/actions/matches'
import { isMatchAppealable } from '@/lib/match-utils'
import { createAdminClient } from '@/lib/supabase'
import { MatchStatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { CommentsSection } from './CommentsSection'
import type { MatchCommentWithAuthor, MatchEvent, SafeProfile } from '@/types'

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [profile] = await Promise.all([requireAuth(), lockExpiredMatches()])

  const match = await getMatchWithPlayers(id)
  if (!match) notFound()

  const db = createAdminClient()
  const [{ data: rawComments }, { data: rawEvents }] = await Promise.all([
    db
      .from('match_comments')
      .select('*')
      .eq('match_id', id)
      .order('created_at', { ascending: true }),
    db
      .from('match_events')
      .select('*')
      .eq('match_id', id)
      .order('created_at', { ascending: true }),
  ])

  // Fetch author profiles for comments
  const authorIds = [
    ...new Set(((rawComments ?? []) as Array<{ author_id: string }>).map((c) => c.author_id)),
  ]
  const { data: authorProfiles } = authorIds.length
    ? await db
        .from('profiles')
        .select('id, display_name, nickname, avatar_url, role, status, favorite_team_id, bio, preferred_formation, playing_style, strongest_skill, weak_skill, created_at, updated_at')
        .in('id', authorIds)
    : { data: [] }

  const authorMap = Object.fromEntries(((authorProfiles ?? []) as SafeProfile[]).map((p) => [p.id, p]))

  const comments: MatchCommentWithAuthor[] = ((rawComments ?? []) as Array<{
    id: string; match_id: string; author_id: string; body: string
    created_at: string; updated_at: string; is_deleted: boolean
  }>).map((c) => ({
    ...c,
    author: authorMap[c.author_id] ?? null,
  }))

  const events = (rawEvents ?? []) as MatchEvent[]

  const appealable = isMatchAppealable(match)
  const aWon = match.winner_id === match.player_a_id
  const bWon = match.winner_id === match.player_b_id

  const playedDate = new Date(match.played_at).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link href="/matches" style={{ color: '#4a5280', textDecoration: 'none', fontSize: '1.25rem' }}>←</Link>
        <h1 className="page-title">Match Details</h1>
      </div>

      {/* Score card */}
      <div
        className="card"
        style={{
          padding: '1.75rem 1.5rem',
          background: 'linear-gradient(135deg, #0d1440 0%, #141d5c 100%)',
          borderColor: 'rgba(45,140,240,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Player A */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <Link href={`/player/${match.player_a_id}`} style={{ textDecoration: 'none' }}>
              <Avatar
                name={match.player_a?.display_name ?? '?'}
                avatarUrl={match.player_a?.avatar_url ?? null}
                size="lg"
              />
              <p style={{
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: aWon ? '#f5c842' : '#f0f2fa',
                marginTop: '0.5rem',
                wordBreak: 'break-word',
              }}>
                {match.player_a?.display_name ?? 'Unknown'}
                {match.player_a_id === profile.id && (
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#2d8cf0' }}>(You)</span>
                )}
              </p>
              {match.player_a_team && (
                <p style={{ fontSize: '0.75rem', color: '#4a5280', marginTop: '0.125rem' }}>
                  {match.player_a_team.name}
                </p>
              )}
            </Link>
            {aWon && <div style={{ marginTop: '0.5rem' }}><span className="badge badge-gold">Winner</span></div>}
          </div>

          {/* Score */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{
              fontSize: '3rem',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}>
              <span style={{ color: aWon ? '#f5c842' : bWon ? '#4a5280' : '#f0f2fa' }}>{match.player_a_score}</span>
              <span style={{ color: '#1e2a7a', fontSize: '2rem' }}>–</span>
              <span style={{ color: bWon ? '#f5c842' : aWon ? '#4a5280' : '#f0f2fa' }}>{match.player_b_score}</span>
            </div>
            {match.is_draw ? (
              <span className="badge badge-gray" style={{ marginTop: '0.375rem' }}>Draw</span>
            ) : null}
            <div style={{ marginTop: '0.5rem' }}>
              <MatchStatusBadge status={match.status} />
            </div>
          </div>

          {/* Player B */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <Link href={`/player/${match.player_b_id}`} style={{ textDecoration: 'none' }}>
              <Avatar
                name={match.player_b?.display_name ?? '?'}
                avatarUrl={match.player_b?.avatar_url ?? null}
                size="lg"
              />
              <p style={{
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: bWon ? '#f5c842' : '#f0f2fa',
                marginTop: '0.5rem',
                wordBreak: 'break-word',
              }}>
                {match.player_b?.display_name ?? 'Unknown'}
                {match.player_b_id === profile.id && (
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#2d8cf0' }}>(You)</span>
                )}
              </p>
              {match.player_b_team && (
                <p style={{ fontSize: '0.75rem', color: '#4a5280', marginTop: '0.125rem' }}>
                  {match.player_b_team.name}
                </p>
              )}
            </Link>
            {bWon && <div style={{ marginTop: '0.5rem' }}><span className="badge badge-gold">Winner</span></div>}
          </div>
        </div>
      </div>

      {/* Match info */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <p className="section-title" style={{ marginBottom: '0.875rem' }}>Match Info</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <InfoRow label="Date" value={playedDate} />
          <InfoRow label="Type" value={match.match_type.replace(/_/g, ' ')} />
          <InfoRow
            label="Submitted by"
            value={match.submitted_by_profile?.display_name ?? 'Unknown'}
          />
          {match.notes && <InfoRow label="Notes" value={match.notes} />}
        </div>

        {/* Appeal deadline */}
        {appealable && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(245,166,35,0.08)',
              border: '1px solid rgba(245,166,35,0.25)',
              borderRadius: 8,
            }}
          >
            <p style={{ fontSize: '0.8125rem', color: '#f5a623', fontWeight: 600, marginBottom: '0.25rem' }}>
              ⏱ Appealable until {new Date(match.appeal_deadline).toLocaleString('en-GB', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#8892b0' }}>
              Full appeal system coming in Phase 3. This result will lock automatically when the window closes.
            </p>
          </div>
        )}

        {match.status === 'locked' && match.locked_at && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(34,168,74,0.06)',
              border: '1px solid rgba(34,168,74,0.2)',
              borderRadius: 8,
            }}
          >
            <p style={{ fontSize: '0.8125rem', color: '#22a84a', fontWeight: 600 }}>
              ✓ Locked on {new Date(match.locked_at).toLocaleString('en-GB', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Event timeline */}
      {events.length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <p className="section-title" style={{ marginBottom: '0.875rem' }}>Timeline</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {events.map((ev) => (
              <div key={ev.id} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.875rem', flexShrink: 0, marginTop: '0.0625rem' }}>
                  {eventIcon(ev.event_type)}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8125rem', color: '#8892b0' }}>{eventLabel(ev.event_type)}</p>
                  <p style={{ fontSize: '0.75rem', color: '#4a5280' }}>
                    {new Date(ev.created_at).toLocaleString('en-GB', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <CommentsSection matchId={id} comments={comments} currentProfile={profile} />
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
      <span style={{ minWidth: 100, fontSize: '0.75rem', fontWeight: 600, color: '#4a5280', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: '0.875rem', color: '#f0f2fa', textTransform: label === 'Type' ? 'capitalize' : undefined }}>
        {value}
      </span>
    </div>
  )
}

function eventIcon(type: string): string {
  switch (type) {
    case 'match_created': return '🎮'
    case 'match_locked': return '🔒'
    case 'comment_added': return '💬'
    case 'match_status_changed': return '🔄'
    case 'match_cancelled_later': return '❌'
    default: return '📋'
  }
}

function eventLabel(type: string): string {
  switch (type) {
    case 'match_created': return 'Match recorded'
    case 'match_locked': return 'Result locked — appeal window closed'
    case 'comment_added': return 'Comment added'
    case 'match_status_changed': return 'Status changed'
    case 'match_cancelled_later': return 'Match cancelled'
    default: return type.replace(/_/g, ' ')
  }
}
