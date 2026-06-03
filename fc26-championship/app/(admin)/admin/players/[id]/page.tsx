import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin, canManagePlayer } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { EditPlayerForm } from './EditPlayerForm'
import type { SafeProfile } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlayerDetailPage({ params }: Props) {
  const { id } = await params
  const admin = await requireAdmin()
  const db = createAdminClient()

  const { data: player } = await db
    .from('profiles')
    .select('id, display_name, nickname, role, status, avatar_url, bio, preferred_formation, playing_style, strongest_skill, weak_skill, favorite_team_id, created_at, updated_at')
    .eq('id', id)
    .single()

  if (!player) notFound()

  const canEdit = canManagePlayer(admin, player as SafeProfile)

  return (
    <>
      <AdminTopBar
        title="Player Profile"
        actions={
          <Link href="/admin/players" className="btn btn-ghost btn-sm">
            ← Players
          </Link>
        }
      />

      <div style={{ padding: '1.5rem', maxWidth: 700, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Profile header card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Avatar name={player.display_name} avatarUrl={player.avatar_url} size="xl" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.375rem', color: '#f0f2fa', marginBottom: '0.25rem' }}>
                {player.display_name}
              </h2>
              {player.nickname && (
                <p style={{ color: '#8892b0', marginBottom: '0.5rem' }}>
                  &ldquo;{player.nickname}&rdquo;
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                <RoleBadge role={player.role} />
                <StatusBadge status={player.status} />
              </div>
              {player.bio && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#8892b0', lineHeight: 1.6 }}>
                  {player.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Edit form or read-only view */}
        {canEdit ? (
          <EditPlayerForm player={player as SafeProfile} adminRole={admin.role} />
        ) : (
          <div className="card-inner" style={{ padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#8892b0' }}>
              You don&apos;t have permission to edit this account.
            </p>
          </div>
        )}

        {/* Meta info */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <p className="section-title" style={{ marginBottom: '0.75rem' }}>Account Info</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <InfoRow label="ID" value={player.id} mono />
            <InfoRow label="Created" value={new Date(player.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })} />
            <InfoRow label="Updated" value={new Date(player.updated_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })} />
            {player.preferred_formation && <InfoRow label="Formation" value={player.preferred_formation} />}
            {player.playing_style && <InfoRow label="Style" value={player.playing_style} />}
            {player.strongest_skill && <InfoRow label="Strongest" value={player.strongest_skill} />}
            {player.weak_skill && <InfoRow label="Weakness" value={player.weak_skill} />}
          </div>
        </div>
      </div>
    </>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
      <span style={{ minWidth: 90, fontSize: '0.75rem', fontWeight: 600, color: '#4a5280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.875rem', color: '#8892b0', fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  )
}
