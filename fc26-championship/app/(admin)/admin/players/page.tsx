import Link from 'next/link'
import { requireAdmin } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { SafeProfile } from '@/types'

export default async function AdminPlayersPage() {
  await requireAdmin()
  const db = createAdminClient()

  const { data: players } = await db
    .from('profiles')
    .select('id, display_name, nickname, role, status, avatar_url, created_at')
    .order('created_at', { ascending: false })

  return (
    <>
      <AdminTopBar
        title="Players"
        actions={
          <Link href="/admin/players/new" className="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Player
          </Link>
        }
      />

      <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {(!players || players.length === 0) ? (
          <div className="card" style={{ marginTop: '1rem' }}>
            <EmptyState
              icon="👥"
              title="No players yet"
              description="Create the first player account to get started."
              action={
                <Link href="/admin/players/new" className="btn btn-primary btn-sm">
                  Create Player
                </Link>
              }
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {players.map((p) => (
              <PlayerRow key={p.id} player={p as SafeProfile} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function PlayerRow({ player }: { player: SafeProfile }) {
  return (
    <Link href={`/admin/players/${player.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{
          padding: '0.875rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          cursor: 'pointer',
          transition: 'border-color 150ms',
        }}
      >
        <Avatar name={player.display_name} avatarUrl={player.avatar_url} size="md" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#f0f2fa', marginBottom: '0.125rem' }}>
            {player.display_name}
            {player.nickname && (
              <span style={{ fontWeight: 400, color: '#8892b0', marginLeft: '0.375rem' }}>
                &ldquo;{player.nickname}&rdquo;
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <RoleBadge role={player.role} />
            <StatusBadge status={player.status} />
          </div>
        </div>

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4a5280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </Link>
  )
}
