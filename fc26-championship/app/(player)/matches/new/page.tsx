import Link from 'next/link'
import { requireAuth } from '@/lib/permissions'
import { canRecordFriendlyMatch } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { RecordMatchForm } from './RecordMatchForm'
import type { SafeProfile, FcTeam } from '@/types'

export default async function NewMatchPage() {
  const profile = await requireAuth()

  if (!canRecordFriendlyMatch(profile)) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <p style={{ fontWeight: 600, color: '#e53e3e' }}>Access Denied</p>
        <p style={{ fontSize: '0.875rem' }}>Your account is not permitted to record matches.</p>
        <Link href="/matches" className="btn btn-ghost" style={{ marginTop: '0.5rem' }}>Back to Matches</Link>
      </div>
    )
  }

  const db = createAdminClient()
  const [{ data: allPlayers }, { data: teams }] = await Promise.all([
    db
      .from('profiles')
      .select('id, display_name, nickname, avatar_url, role, status, favorite_team_id, bio, preferred_formation, playing_style, strongest_skill, weak_skill, created_at, updated_at')
      .eq('status', 'active')
      .order('display_name'),
    db.from('fc_teams').select('*').order('name'),
  ])

  const opponents = ((allPlayers ?? []) as SafeProfile[]).filter((p) => p.id !== profile.id)

  if (opponents.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/matches" style={{ color: '#4a5280', textDecoration: 'none', fontSize: '1.25rem' }}>←</Link>
          <h1 className="page-title">Record Friendly Match</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p style={{ fontWeight: 600, color: '#8892b0' }}>No opponents available</p>
          <p style={{ fontSize: '0.875rem' }}>Ask your admin to add more players first.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link href="/matches" style={{ color: '#4a5280', textDecoration: 'none', fontSize: '1.25rem' }}>←</Link>
        <h1 className="page-title">Record Friendly Match</h1>
      </div>
      <RecordMatchForm opponents={opponents} teams={(teams ?? []) as FcTeam[]} />
    </div>
  )
}
