import Link from 'next/link'
import { requireAdmin } from '@/lib/permissions'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { CreatePlayerForm } from './CreatePlayerForm'

export default async function NewPlayerPage() {
  const admin = await requireAdmin()
  return (
    <>
      <AdminTopBar
        title="New Player"
        actions={
          <Link href="/admin/players" className="btn btn-ghost btn-sm">
            ← Back
          </Link>
        }
      />
      <div style={{ padding: '1.5rem', maxWidth: 560, margin: '0 auto', width: '100%' }}>
        <CreatePlayerForm adminRole={admin.role} />
      </div>
    </>
  )
}
