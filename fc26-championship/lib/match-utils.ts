import type { Match } from '@/types'

export function isMatchAppealable(match: Pick<Match, 'status' | 'appeal_deadline'>): boolean {
  return (
    match.status === 'confirmed_appealable' &&
    new Date(match.appeal_deadline) > new Date()
  )
}
