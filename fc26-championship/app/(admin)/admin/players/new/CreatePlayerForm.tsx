'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createPlayerAction } from '@/lib/actions/players'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Role } from '@/types'

interface CreatePlayerFormProps {
  adminRole: Role
}

export function CreatePlayerForm({ adminRole }: CreatePlayerFormProps) {
  const [isPending, startTransition] = useTransition()
  const [showCode, setShowCode] = useState(false)

  const availableRoles: Role[] = adminRole === 'super_admin'
    ? ['player', 'moderator', 'super_admin']
    : ['player']

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createPlayerAction(formData)
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="card" style={{ padding: '1.75rem' }}>
      <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#f0f2fa', marginBottom: '1.5rem' }}>
        Player Details
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="display_name">Display Name *</label>
          <input name="display_name" id="display_name" required className="input-field" placeholder="e.g. Arthur Aghamyan" />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="nickname">Nickname</label>
          <input name="nickname" id="nickname" className="input-field" placeholder="e.g. The King" />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="role">Role</label>
          <select name="role" id="role" className="select-field" defaultValue="player">
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {r === 'super_admin' ? 'Super Admin' : r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="access_code">Access Code *</label>
          <div style={{ position: 'relative' }}>
            <input
              name="access_code"
              id="access_code"
              type={showCode ? 'text' : 'password'}
              required
              className="input-field"
              placeholder="Set a unique access code"
              style={{ paddingRight: '2.75rem' }}
            />
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#4a5280',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
              aria-label={showCode ? 'Hide' : 'Show'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showCode
                  ? <><line x1="1" y1="1" x2="23" y2="23"/><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/></>
                  : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                }
              </svg>
            </button>
          </div>
          <p className="form-hint">Players use this code to log in. Share it privately.</p>
        </div>

        <hr className="divider" />

        <button type="submit" disabled={isPending} className="btn btn-primary btn-full">
          {isPending ? <LoadingSpinner size={16} /> : null}
          {isPending ? 'Creating…' : 'Create Player'}
        </button>
      </form>
    </div>
  )
}
