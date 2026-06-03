import { requireAuth } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase'
import { PlayerTopBar } from '@/components/player/PlayerTopBar'
import { BottomNav } from '@/components/player/BottomNav'
import { ToastProvider } from '@/components/ui/Toast'

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAuth()
  const db = createAdminClient()

  const { count } = await db
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id)
    .eq('is_read', false)

  return (
    <>
      <ToastProvider />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <PlayerTopBar profile={profile} notificationCount={count ?? 0} />
        <main
          style={{
            flex: 1,
            padding: '1.25rem 1rem',
            paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
            maxWidth: 640,
            margin: '0 auto',
            width: '100%',
          }}
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </>
  )
}
