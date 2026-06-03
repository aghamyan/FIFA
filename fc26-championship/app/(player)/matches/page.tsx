import Link from 'next/link'
import { requireAuth } from '@/lib/permissions'
import { lockExpiredMatches, getMatchesWithPlayers } from '@/lib/actions/matches'
import { MatchCard } from '@/components/matches/MatchCard'
import { createAdminClient } from '@/lib/supabase'
import type { SafeProfile } from '@/types'

interface SearchParams {
  filter?: string
  player?: string
  status?: string
  match_type?: string
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [profile] = await Promise.all([requireAuth(), lockExpiredMatches()])

  const params = await searchParams
  const filter = params.filter ?? 'all'
  const playerFilter = params.player
  const statusFilter = params.status
  const matchTypeFilter = params.match_type

  const myOnly = filter === 'my'
  const friendlyOnly = filter === 'friendly'

  const matches = await getMatchesWithPlayers({
    myId: myOnly ? profile.id : undefined,
    playerIdFilter: playerFilter,
    status: statusFilter,
    matchType: friendlyOnly ? 'friendly' : matchTypeFilter,
  })

  const db = createAdminClient()
  const { data: players } = await db
    .from('profiles')
    .select('id, display_name')
    .eq('status', 'active')
    .order('display_name')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="page-title">Matches</h1>
        <Link href="/matches/new" className="btn btn-primary btn-sm">
          + Record
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Quick filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'All', value: 'all' },
            { label: 'My Matches', value: 'my' },
            { label: 'Friendlies', value: 'friendly' },
          ].map((f) => (
            <Link
              key={f.value}
              href={`/matches?filter=${f.value}`}
              className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-ghost'}`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Status + Player filter row */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <form method="get" action="/matches" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
            <input type="hidden" name="filter" value={filter} />
            <select
              name="status"
              defaultValue={statusFilter ?? ''}
              className="select-field"
              style={{ flex: 1, minWidth: 120 }}
            >
              <option value="">All statuses</option>
              <option value="confirmed_appealable">Appealable</option>
              <option value="locked">Locked</option>
              <option value="under_appeal">Under Appeal</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              name="player"
              defaultValue={playerFilter ?? ''}
              className="select-field"
              style={{ flex: 1, minWidth: 140 }}
            >
              <option value="">All players</option>
              {(players ?? []).map((p: Pick<SafeProfile, 'id' | 'display_name'>) => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
            </select>

            <button type="submit" className="btn btn-ghost btn-sm">Filter</button>
            <Link href="/matches" className="btn btn-ghost btn-sm">Clear</Link>
          </form>
        </div>
      </div>

      {/* Match list */}
      {matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚽</div>
          <p style={{ fontWeight: 600, color: '#8892b0' }}>No matches yet</p>
          <p style={{ fontSize: '0.875rem' }}>
            {myOnly
              ? "You haven't played any matches yet."
              : 'No matches have been recorded yet.'}
          </p>
          <Link href="/matches/new" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Record the first friendly match
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {matches.map((m) => (
            <MatchCard key={m.id} match={m as Parameters<typeof MatchCard>[0]['match']} currentUserId={profile.id} />
          ))}
        </div>
      )}
    </div>
  )
}
