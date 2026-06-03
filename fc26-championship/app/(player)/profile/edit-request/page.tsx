import { requireAuth } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { EditRequestForm } from './EditRequestForm'
import type { FcTeam } from '@/types'

export default async function EditRequestPage() {
  const profile = await requireAuth()
  const db = createAdminClient()

  const [{ data: teams }, { data: pendingReq }] = await Promise.all([
    db.from('fc_teams').select('id, name').order('name'),
    db
      .from('profile_change_requests')
      .select('id')
      .eq('profile_id', profile.id)
      .eq('status', 'pending')
      .single(),
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 className="page-title">Request Profile Update</h1>
        <p style={{ marginTop: '0.375rem', fontSize: '0.875rem', color: '#8892b0' }}>
          Changes won&apos;t be applied until an admin reviews them.
        </p>
      </div>

      {pendingReq ? (
        <div className="card" style={{ padding: '1.5rem', borderColor: 'rgba(245,166,35,0.3)' }}>
          <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>⏳</span>
            <div>
              <p style={{ fontWeight: 600, color: '#f5a623', marginBottom: '0.25rem' }}>
                You have a pending request
              </p>
              <p style={{ fontSize: '0.875rem', color: '#8892b0' }}>
                Your last profile change request is still waiting for admin review. You can only have one pending request at a time.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <EditRequestForm
          profile={profile}
          teams={(teams ?? []) as FcTeam[]}
        />
      )}
    </div>
  )
}
