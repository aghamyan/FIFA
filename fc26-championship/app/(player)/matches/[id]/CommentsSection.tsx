'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { addCommentAction, deleteCommentAction } from '@/lib/actions/comments'
import { Avatar } from '@/components/ui/Avatar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { MatchCommentWithAuthor, SafeProfile } from '@/types'

interface CommentsSectionProps {
  matchId: string
  comments: MatchCommentWithAuthor[]
  currentProfile: SafeProfile
}

export function CommentsSection({ matchId, comments, currentProfile }: CommentsSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [commentText, setCommentText] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = commentText.trim()
    if (!text) {
      toast.error('Comment cannot be empty.')
      return
    }
    const formData = new FormData()
    formData.set('body', text)

    startTransition(async () => {
      const result = await addCommentAction(matchId, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        setCommentText('')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p className="section-title">Comments</p>

      {/* Comment list */}
      {comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#4a5280', fontSize: '0.875rem' }}>
          No comments yet. Start the match discussion.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentProfile={currentProfile}
            />
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        <textarea
          className="textarea-field"
          placeholder="Add a comment…"
          style={{ minHeight: 72 }}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={isPending || !commentText.trim()}
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: 'flex-end' }}
        >
          {isPending ? <LoadingSpinner size={14} /> : null}
          {isPending ? 'Posting…' : 'Post comment'}
        </button>
      </form>
    </div>
  )
}

function CommentItem({
  comment,
  currentProfile,
}: {
  comment: MatchCommentWithAuthor
  currentProfile: SafeProfile
}) {
  const [isPending, startTransition] = useTransition()

  const canDelete =
    currentProfile.role === 'super_admin' ||
    currentProfile.role === 'moderator' ||
    comment.author_id === currentProfile.id

  if (comment.is_deleted) {
    return (
      <div className="card-inner" style={{ padding: '0.625rem 0.875rem' }}>
        <p style={{ fontSize: '0.8125rem', color: '#4a5280', fontStyle: 'italic' }}>Comment deleted.</p>
      </div>
    )
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCommentAction(comment.id)
      if (result.error) toast.error(result.error)
    })
  }

  const timeAgo = formatRelativeTime(comment.created_at)

  return (
    <div className="card-inner" style={{ padding: '0.75rem 0.875rem' }}>
      <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
        <Avatar
          name={comment.author?.display_name ?? '?'}
          avatarUrl={comment.author?.avatar_url ?? null}
          size="sm"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f0f2fa' }}>
              {comment.author?.display_name ?? 'Unknown'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#4a5280' }}>{timeAgo}</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#8892b0', lineHeight: 1.55, wordBreak: 'break-word' }}>
            {comment.body}
          </p>
        </div>
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            style={{
              background: 'none',
              border: 'none',
              color: '#4a5280',
              cursor: 'pointer',
              padding: '0.25rem',
              fontSize: '0.75rem',
              flexShrink: 0,
              transition: 'color 150ms',
            }}
            title="Delete comment"
            aria-label="Delete comment"
          >
            {isPending ? '…' : '✕'}
          </button>
        )}
      </div>
    </div>
  )
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
