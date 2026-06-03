'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import type { SafeProfile } from '@/types'

interface PlayerTopBarProps {
  profile: SafeProfile
  notificationCount?: number
}

export function PlayerTopBar({ profile, notificationCount = 0 }: PlayerTopBarProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Logged out')
    router.push('/login')
    router.refresh()
  }

  return (
    <header
      style={{
        height: 56,
        background: '#070c26',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        gap: '0.75rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <span style={{ fontSize: '1.375rem', marginRight: '0.25rem' }}>⚽</span>
      <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#f0f2fa', flex: 1, letterSpacing: '-0.01em' }}>
        FC26
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Notification bell */}
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            color: '#8892b0',
            cursor: 'pointer',
            padding: '0.375rem',
            borderRadius: '8px',
          }}
          aria-label="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notificationCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 16,
                height: 16,
                background: '#e53e3e',
                borderRadius: '50%',
                fontSize: '0.625rem',
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        <button
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
          aria-label="Logout"
        >
          <Avatar name={profile.display_name} avatarUrl={profile.avatar_url} size="sm" />
        </button>
      </div>
    </header>
  )
}
