import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { lockExpiredMatches, getMatchesWithPlayers } from '@/lib/actions/matches'
import { MatchCard } from '@/components/matches/MatchCard'
import type { SafeProfile } from '@/types'

export default async function PlayerMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [currentProfile] = await Promise.all([requireAuth(), lockExpiredMatches()])

  const db = createAdminClient()
  const { data: player } = await db
    .from('profiles')
    .select('id, display_name, nickname')
    .eq('id', id)
    .single()

  if (!player) notFound()

  const profile = player as Pick<SafeProfile, 'id' | 'display_name' | 'nickname'>

  const matches = await getMatchesWithPlayers({ playerIdFilter: id })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link href={`/player/${id}`} style={{ color: '#4a5280', textDecoration: 'none', fontSize: '1.25rem' }}>←</Link>
        <div>
          <h1 className="page-title">{profile.display_name}</h1>
          <p style={{ fontSize: '0.8125rem', color: '#4a5280' }}>All matches — {matches.length} total</p>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚽</div>
          <p style={{ fontWeight: 600, color: '#8892b0' }}>No matches yet</p>
          <p style={{ fontSize: '0.875rem' }}>{profile.display_name} has not played any recorded matches.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {matches.map((m) => (
            <MatchCard key={m.id} match={m as Parameters<typeof MatchCard>[0]['match']} currentUserId={currentProfile.id} />
          ))}
        </div>
      )}
    </div>
  )
}
