'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { recordFriendlyMatchAction } from '@/lib/actions/matches'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { SafeProfile, FcTeam } from '@/types'

interface RecordMatchFormProps {
  opponents: SafeProfile[]
  teams: FcTeam[]
}

export function RecordMatchForm({ opponents, teams }: RecordMatchFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  now.setSeconds(0, 0)
  const defaultPlayedAt = now.toISOString().slice(0, 16)

  const [myScore, setMyScore] = useState('')
  const [opponentScore, setOpponentScore] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await recordFriendlyMatchAction(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Match recorded!')
        router.push(`/matches/${result.matchId}`)
        router.refresh()
      }
    })
  }

  const ms = parseInt(myScore, 10)
  const os = parseInt(opponentScore, 10)
  const bothValid = !isNaN(ms) && !isNaN(os) && ms >= 0 && os >= 0
  const resultPreview = bothValid
    ? ms > os
      ? '✅ Win'
      : ms < os
        ? '❌ Loss'
        : '🤝 Draw'
    : null

  return (
    <div className="card" style={{ padding: '1.75rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Opponent */}
        <div className="form-group">
          <label className="label" htmlFor="opponent_id">Opponent *</label>
          <select name="opponent_id" id="opponent_id" required className="select-field">
            <option value="">— Select opponent —</option>
            {opponents.map((p) => (
              <option key={p.id} value={p.id}>{p.display_name}{p.nickname ? ` "${p.nickname}"` : ''}</option>
            ))}
          </select>
        </div>

        {/* Score */}
        <div>
          <label className="label" style={{ display: 'block', marginBottom: '0.375rem' }}>Score *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.625rem', alignItems: 'center' }}>
            <div className="form-group">
              <label className="label" htmlFor="my_score" style={{ fontSize: '0.7rem' }}>Your goals</label>
              <input
                name="my_score"
                id="my_score"
                type="number"
                min={0}
                max={99}
                required
                className="input-field"
                style={{ textAlign: 'center', fontSize: '1.375rem', fontWeight: 800, padding: '0.75rem' }}
                placeholder="0"
                value={myScore}
                onChange={(e) => setMyScore(e.target.value)}
              />
            </div>
            <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.25rem', color: '#4a5280', paddingTop: '1.25rem' }}>–</div>
            <div className="form-group">
              <label className="label" htmlFor="opponent_score" style={{ fontSize: '0.7rem' }}>Their goals</label>
              <input
                name="opponent_score"
                id="opponent_score"
                type="number"
                min={0}
                max={99}
                required
                className="input-field"
                style={{ textAlign: 'center', fontSize: '1.375rem', fontWeight: 800, padding: '0.75rem' }}
                placeholder="0"
                value={opponentScore}
                onChange={(e) => setOpponentScore(e.target.value)}
              />
            </div>
          </div>
          {resultPreview && (
            <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#8892b0' }}>
              Result: {resultPreview}
            </p>
          )}
        </div>

        {/* Teams (optional) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="my_team_id">Your team</label>
            <select name="my_team_id" id="my_team_id" className="select-field">
              <option value="">— Optional —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="opponent_team_id">Their team</label>
            <select name="opponent_team_id" id="opponent_team_id" className="select-field">
              <option value="">— Optional —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Played at */}
        <div className="form-group">
          <label className="label" htmlFor="played_at">Date & Time Played</label>
          <input
            name="played_at"
            id="played_at"
            type="datetime-local"
            className="input-field"
            defaultValue={defaultPlayedAt}
          />
          <p className="form-hint">Defaults to now if left unchanged.</p>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="label" htmlFor="notes">Notes</label>
          <textarea
            name="notes"
            id="notes"
            className="textarea-field"
            placeholder="Optional — e.g. 'Close match, great comeback in 2nd half'"
            style={{ minHeight: 72 }}
          />
        </div>

        <hr className="divider" />

        <div
          className="card-inner"
          style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#8892b0', lineHeight: 1.6 }}
        >
          After submission, this match will count immediately in stats and both players will be notified.
          The result is <span style={{ color: '#f5a623' }}>appealable for 24 hours</span>.
        </div>

        <button type="submit" disabled={isPending} className="btn btn-primary btn-full btn-lg">
          {isPending ? <LoadingSpinner size={16} /> : null}
          {isPending ? 'Recording…' : 'Record Match'}
        </button>
      </form>
    </div>
  )
}
