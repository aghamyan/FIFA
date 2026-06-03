'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { reviewProfileChangeRequest } from '@/lib/actions/profileRequests'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ReviewRequestButtonsProps {
  requestId: string
}

export function ReviewRequestButtons({ requestId }: ReviewRequestButtonsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showNoteField, setShowNoteField] = useState(false)
  const [note, setNote] = useState('')
  const [pendingAction, setPendingAction] = useState<'approved' | 'rejected' | null>(null)

  function handleAction(action: 'approved' | 'rejected') {
    setPendingAction(action)
    if (!showNoteField && action === 'rejected') {
      setShowNoteField(true)
      return
    }
    submitReview(action)
  }

  function submitReview(action: 'approved' | 'rejected') {
    startTransition(async () => {
      const result = await reviewProfileChangeRequest(requestId, action, note.trim() || undefined)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(action === 'approved' ? 'Request approved' : 'Request rejected')
        router.refresh()
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {showNoteField && (
        <div className="form-group">
          <label className="label" htmlFor={`note-${requestId}`}>Admin Note (optional)</label>
          <textarea
            id={`note-${requestId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="textarea-field"
            placeholder="Reason for rejection…"
            style={{ minHeight: 72 }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => handleAction('approved')}
          disabled={isPending}
          className="btn btn-primary btn-sm"
        >
          {isPending && pendingAction === 'approved' ? <LoadingSpinner size={14} /> : null}
          Approve
        </button>
        <button
          onClick={() => handleAction('rejected')}
          disabled={isPending}
          className="btn btn-danger btn-sm"
        >
          {isPending && pendingAction === 'rejected' ? <LoadingSpinner size={14} /> : null}
          {showNoteField && pendingAction === 'rejected' ? 'Confirm Reject' : 'Reject'}
        </button>
        {showNoteField && (
          <button
            onClick={() => { setShowNoteField(false); setNote(''); setPendingAction(null) }}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
