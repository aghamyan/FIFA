import { requireAdmin, canReviewProfileRequest } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { Avatar } from '@/components/ui/Avatar'
import { RequestStatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ReviewRequestButtons } from './ReviewRequestButtons'
import type { SafeProfile, ProfileChangeRequest } from '@/types'

export default async function ProfileRequestsPage() {
  const admin = await requireAdmin()
  const canReview = canReviewProfileRequest(admin)
  const db = createAdminClient()

  const { data: requests } = await db
    .from('profile_change_requests')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch all unique profile IDs referenced
  const profileIds = [...new Set((requests ?? []).map((r) => r.profile_id))]
  const { data: profiles } = profileIds.length
    ? await db.from('profiles').select('id, display_name, nickname, avatar_url').in('id', profileIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  const pending = (requests ?? []).filter((r) => r.status === 'pending')
  const reviewed = (requests ?? []).filter((r) => r.status !== 'pending')

  return (
    <>
      <AdminTopBar title="Profile Requests" />
      <div style={{ padding: '1.5rem', maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Pending */}
        <section>
          <p className="section-title" style={{ marginBottom: '0.75rem' }}>
            Pending
            {pending.length > 0 && (
              <span className="badge badge-orange" style={{ marginLeft: '0.5rem' }}>{pending.length}</span>
            )}
          </p>
          {pending.length === 0 ? (
            <div className="card">
              <EmptyState icon="✅" title="No pending requests" description="All change requests have been reviewed." />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pending.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req as ProfileChangeRequest}
                  profile={profileMap.get(req.profile_id) as SafeProfile | undefined}
                  canReview={canReview}
                />
              ))}
            </div>
          )}
        </section>

        {/* Reviewed */}
        {reviewed.length > 0 && (
          <section>
            <p className="section-title" style={{ marginBottom: '0.75rem' }}>Recent Reviews</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {reviewed.slice(0, 20).map((req) => (
                <RequestCard
                  key={req.id}
                  request={req as ProfileChangeRequest}
                  profile={profileMap.get(req.profile_id) as SafeProfile | undefined}
                  canReview={false}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

interface RequestCardProps {
  request: ProfileChangeRequest
  profile: SafeProfile | undefined
  canReview: boolean
}

function RequestCard({ request, profile, canReview }: RequestCardProps) {
  const changes = request.requested_changes as Record<string, unknown>

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
        {profile && (
          <Avatar name={profile.display_name} avatarUrl={profile.avatar_url} size="md" />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#f0f2fa', marginBottom: '0.125rem' }}>
            {profile?.display_name ?? 'Unknown Player'}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#4a5280' }}>
            {new Date(request.created_at).toLocaleDateString('en-GB', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </div>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>

      {/* Requested changes */}
      <div className="card-inner" style={{ padding: '0.875rem', marginBottom: request.status === 'pending' && canReview ? '1rem' : 0 }}>
        <p className="section-title" style={{ marginBottom: '0.5rem' }}>Requested Changes</p>
        <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {Object.entries(changes).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', gap: '0.5rem' }}>
              <dt style={{ minWidth: 130, fontSize: '0.75rem', fontWeight: 600, color: '#4a5280', textTransform: 'capitalize' }}>
                {key.replace(/_/g, ' ')}
              </dt>
              <dd style={{ fontSize: '0.875rem', color: '#8892b0', wordBreak: 'break-word' }}>
                {String(value) || '—'}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {request.admin_note && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 6, borderLeft: '3px solid rgba(255,255,255,0.12)' }}>
          <p style={{ fontSize: '0.8125rem', color: '#8892b0' }}>
            <span style={{ fontWeight: 600, color: '#4a5280' }}>Admin note: </span>
            {request.admin_note}
          </p>
        </div>
      )}

      {request.status === 'pending' && canReview && (
        <div style={{ marginTop: '1rem' }}>
          <ReviewRequestButtons requestId={request.id} />
        </div>
      )}
    </div>
  )
}
