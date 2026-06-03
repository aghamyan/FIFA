'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { submitProfileChangeRequest } from '@/lib/actions/profileRequests'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { SafeProfile, FcTeam, ProfileChangePayload } from '@/types'

interface EditRequestFormProps {
  profile: SafeProfile
  teams: FcTeam[]
}

export function EditRequestForm({ profile, teams }: EditRequestFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<ProfileChangePayload>({
    nickname:            profile.nickname ?? '',
    bio:                 profile.bio ?? '',
    preferred_formation: profile.preferred_formation ?? '',
    playing_style:       profile.playing_style ?? '',
    strongest_skill:     profile.strongest_skill ?? '',
    weak_skill:          profile.weak_skill ?? '',
    favorite_team_id:    profile.favorite_team_id ?? '',
  })

  function handleChange(key: keyof ProfileChangePayload, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Build diff: only include fields that actually changed
    const changes: ProfileChangePayload = {}
    const keys = Object.keys(form) as (keyof ProfileChangePayload)[]
    for (const key of keys) {
      const newVal = form[key] ?? ''
      let oldVal: string
      if (key === 'favorite_team_id') oldVal = profile.favorite_team_id ?? ''
      else if (key === 'nickname') oldVal = profile.nickname ?? ''
      else if (key === 'bio') oldVal = profile.bio ?? ''
      else if (key === 'preferred_formation') oldVal = profile.preferred_formation ?? ''
      else if (key === 'playing_style') oldVal = profile.playing_style ?? ''
      else if (key === 'strongest_skill') oldVal = profile.strongest_skill ?? ''
      else if (key === 'weak_skill') oldVal = profile.weak_skill ?? ''
      else oldVal = ''

      if (newVal !== oldVal && newVal !== '') {
        (changes as Record<string, string>)[key] = newVal
      }
    }

    if (Object.keys(changes).length === 0) {
      toast.error('No changes detected. Modify at least one field.')
      return
    }

    startTransition(async () => {
      const result = await submitProfileChangeRequest(changes)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Change request submitted!')
        router.push('/profile')
        router.refresh()
      }
    })
  }

  return (
    <div className="card" style={{ padding: '1.75rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="nickname">Nickname</label>
          <input
            id="nickname"
            className="input-field"
            value={form.nickname ?? ''}
            onChange={(e) => handleChange('nickname', e.target.value)}
            placeholder="Your in-game nickname"
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            className="textarea-field"
            value={form.bio ?? ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="Tell everyone about yourself…"
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="favorite_team">Favorite Team</label>
          <select
            id="favorite_team"
            className="select-field"
            value={form.favorite_team_id ?? ''}
            onChange={(e) => handleChange('favorite_team_id', e.target.value)}
          >
            <option value="">-- Select a team --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="formation">Preferred Formation</label>
            <input
              id="formation"
              className="input-field"
              value={form.preferred_formation ?? ''}
              onChange={(e) => handleChange('preferred_formation', e.target.value)}
              placeholder="e.g. 4-3-3"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="style">Playing Style</label>
            <input
              id="style"
              className="input-field"
              value={form.playing_style ?? ''}
              onChange={(e) => handleChange('playing_style', e.target.value)}
              placeholder="e.g. Tiki-taka"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="strong">Strongest Skill</label>
            <input
              id="strong"
              className="input-field"
              value={form.strongest_skill ?? ''}
              onChange={(e) => handleChange('strongest_skill', e.target.value)}
              placeholder="e.g. Finishing"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="weak">Weak Skill</label>
            <input
              id="weak"
              className="input-field"
              value={form.weak_skill ?? ''}
              onChange={(e) => handleChange('weak_skill', e.target.value)}
              placeholder="e.g. Defending"
            />
          </div>
        </div>

        <hr className="divider" />

        <button type="submit" disabled={isPending} className="btn btn-primary btn-full">
          {isPending ? <LoadingSpinner size={16} /> : null}
          {isPending ? 'Submitting…' : 'Submit Change Request'}
        </button>
      </form>
    </div>
  )
}
