import type { Role, ProfileStatus, ChangeRequestStatus, MatchStatus } from '@/types'

export function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, { label: string; cls: string }> = {
    super_admin: { label: 'Super Admin', cls: 'badge badge-gold' },
    moderator:   { label: 'Moderator',   cls: 'badge badge-blue' },
    player:      { label: 'Player',      cls: 'badge badge-gray' },
  }
  const { label, cls } = map[role]
  return <span className={cls}>{label}</span>
}

export function StatusBadge({ status }: { status: ProfileStatus }) {
  const map: Record<ProfileStatus, { label: string; cls: string }> = {
    active:     { label: 'Active',     cls: 'badge badge-green' },
    inactive:   { label: 'Inactive',   cls: 'badge badge-gray' },
    restricted: { label: 'Restricted', cls: 'badge badge-red' },
  }
  const { label, cls } = map[status]
  return <span className={cls}>{label}</span>
}

export function RequestStatusBadge({ status }: { status: ChangeRequestStatus }) {
  const map: Record<ChangeRequestStatus, { label: string; cls: string }> = {
    pending:  { label: 'Pending',  cls: 'badge badge-orange' },
    approved: { label: 'Approved', cls: 'badge badge-green' },
    rejected: { label: 'Rejected', cls: 'badge badge-red' },
  }
  const { label, cls } = map[status]
  return <span className={cls}>{label}</span>
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const map: Record<MatchStatus, { label: string; cls: string }> = {
    confirmed_appealable: { label: 'Appealable', cls: 'badge badge-orange' },
    locked:               { label: 'Locked',     cls: 'badge badge-green' },
    under_appeal:         { label: 'Under Appeal', cls: 'badge badge-red' },
    cancelled:            { label: 'Cancelled',  cls: 'badge badge-gray' },
    fraudulent:           { label: 'Fraudulent', cls: 'badge badge-red' },
  }
  const { label, cls } = map[status]
  return <span className={cls}>{label}</span>
}
