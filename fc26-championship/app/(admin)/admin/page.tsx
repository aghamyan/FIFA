import Link from 'next/link'
import { requireAdmin } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { AdminTopBar } from '@/components/admin/AdminTopBar'

export default async function AdminDashboardPage() {
  const admin = await requireAdmin()
  const db = createAdminClient()

  const [
    { count: totalPlayers },
    { count: pendingRequests },
    { count: activePlayers },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('profile_change_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const stats = [
    { label: 'Total Players', value: totalPlayers ?? 0, icon: '👥', href: '/admin/players' },
    { label: 'Active Players', value: activePlayers ?? 0, icon: '✅', href: '/admin/players' },
    { label: 'Pending Requests', value: pendingRequests ?? 0, icon: '📋', href: '/admin/profile-requests', highlight: (pendingRequests ?? 0) > 0 },
  ]

  return (
    <>
      <AdminTopBar title={`Welcome, ${admin.display_name}`} />
      <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  transition: 'border-color 150ms',
                  borderColor: stat.highlight ? 'rgba(245,166,35,0.4)' : undefined,
                }}
              >
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: stat.highlight ? '#f5a623' : '#f0f2fa',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    marginBottom: '0.25rem',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#8892b0', fontWeight: 600 }}>
                  {stat.label}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="section-title" style={{ marginBottom: '0.75rem' }}>Quick Actions</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/admin/players/new" className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Player
            </Link>
            <Link href="/admin/profile-requests" className="btn btn-ghost">
              Review Requests
              {(pendingRequests ?? 0) > 0 && (
                <span className="badge badge-orange" style={{ marginLeft: '0.25rem' }}>
                  {pendingRequests}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Phase 2 notice */}
        <div
          className="card-inner"
          style={{
            padding: '1.25rem',
            display: 'flex',
            gap: '0.875rem',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🏗️</span>
          <div>
            <p style={{ fontWeight: 600, color: '#8892b0', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Phase 2 — Coming Soon
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#4a5280', lineHeight: 1.6 }}>
              Friendly matches, Elo rankings, championships, schedules, belts, and achievements will be available in the next phase.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
