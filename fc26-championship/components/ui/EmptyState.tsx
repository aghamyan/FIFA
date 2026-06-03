interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon}</span>
      <div>
        <p style={{ fontWeight: 600, color: '#8892b0', marginBottom: description ? '0.25rem' : 0 }}>
          {title}
        </p>
        {description && (
          <p style={{ fontSize: '0.875rem', color: '#4a5280' }}>{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
