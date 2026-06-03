'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updatePlayerAction } from '@/lib/actions/players'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { SafeProfile, Role } from '@/types'

interface EditPlayerFormProps {
  player: SafeProfile
  adminRole: Role
}

export function EditPlayerForm({ player, adminRole }: EditPlayerFormProps) {
  const [isPending, startTransition] = useTransition()
  const [showCode, setShowCode] = useState(false)

  const availableRoles: Role[] = adminRole === 'super_admin'
    ? ['player', 'moderator', 'super_admin']
    : ['player']

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updatePlayerAction(player.id, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Player updated')
      }
    })
  }

  return (
    <div className="card" style={{ padding: '1.75rem' }}>
      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#f0f2fa', marginBottom: '1.25rem' }}>
        Edit Player
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="display_name">Display Name *</label>
            <input
              name="display_name"
              id="display_name"
              required
              defaultValue={player.display_name}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="nickname">Nickname</label>
            <input
              name="nickname"
              id="nickname"
              defaultValue={player.nickname ?? ''}
              className="input-field"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="role">Role</label>
            <select name="role" id="role" className="select-field" defaultValue={player.role}>
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r === 'super_admin' ? 'Super Admin' : r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="status">Status</label>
            <select name="status" id="status" className="select-field" defaultValue={player.status}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="access_code">Reset Access Code</label>
          <div style={{ position: 'relative' }}>
            <input
              name="access_code"
              id="access_code"
              type={showCode ? 'text' : 'password'}
              className="input-field"
              placeholder="Leave blank to keep current code"
              style={{ paddingRight: '2.75rem' }}
            />
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              style={{
                position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#4a5280', cursor: 'pointer', padding: '0.25rem',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showCode
                  ? <><line x1="1" y1="1" x2="23" y2="23"/><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/></>
                  : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                }
              </svg>
            </button>
          </div>
          <p className="form-hint">Only fill this if you want to set a new access code.</p>
        </div>

        <hr className="divider" />

        <button type="submit" disabled={isPending} className="btn btn-primary">
          {isPending ? <LoadingSpinner size={16} /> : null}
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
