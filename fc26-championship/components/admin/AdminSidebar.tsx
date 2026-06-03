'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { SafeProfile } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge } from '@/components/ui/Badge'

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
    exact: true,
  },
  {
    label: 'Players',
    href: '/admin/players',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Profile Requests',
    href: '/admin/profile-requests',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
]

interface AdminSidebarProps {
  profile: SafeProfile
}

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        background: '#070c26',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '1.5rem 1.25rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⚽</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f0f2fa', letterSpacing: '-0.01em' }}>
              FC26
            </div>
            <div style={{ fontSize: '0.7rem', color: '#4a5280', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Admin
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                borderRadius: '8px',
                fontWeight: active ? 600 : 500,
                fontSize: '0.9rem',
                color: active ? '#f0f2fa' : '#8892b0',
                background: active ? 'rgba(45,140,240,0.12)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 150ms',
              }}
            >
              <span style={{ color: active ? '#2d8cf0' : 'inherit' }}>{item.icon}</span>
              {item.label}
              {active && (
                <span
                  style={{
                    marginLeft: 'auto',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#2d8cf0',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <Avatar name={profile.display_name} avatarUrl={profile.avatar_url} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#f0f2fa',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {profile.display_name}
          </div>
          <RoleBadge role={profile.role} />
        </div>
      </div>
    </aside>
  )
}
