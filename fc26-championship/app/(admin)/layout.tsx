import { requireAdmin } from '@/lib/permissions'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ToastProvider } from '@/components/ui/Toast'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin()

  return (
    <>
      <ToastProvider />
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <AdminSidebar profile={profile} />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </>
  )
}
