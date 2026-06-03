'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AdminTopBarProps {
  title: string
  actions?: React.ReactNode
}

export function AdminTopBar({ title, actions }: AdminTopBarProps) {
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
        height: 60,
        background: '#070c26',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <h1 style={{ flex: 1, fontSize: '1.0625rem', fontWeight: 700, color: '#f0f2fa', margin: 0 }}>
        {title}
      </h1>
      {actions && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>{actions}</div>}
      <button
        onClick={handleLogout}
        className="btn btn-ghost btn-sm"
        style={{ marginLeft: 'auto' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Logout
      </button>
    </header>
  )
}
