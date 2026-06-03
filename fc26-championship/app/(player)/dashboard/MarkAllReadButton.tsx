'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { markAllNotificationsReadAction } from '@/lib/actions/notifications'

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction()
      if (result.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      style={{
        background: 'none',
        border: 'none',
        color: '#2d8cf0',
        cursor: 'pointer',
        fontSize: '0.8125rem',
        fontWeight: 600,
        padding: 0,
      }}
    >
      {isPending ? 'Marking…' : 'Mark all read'}
    </button>
  )
}
