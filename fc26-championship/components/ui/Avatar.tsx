interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: { box: 28, text: '0.65rem' },
  md: { box: 40, text: '0.875rem' },
  lg: { box: 56, text: '1.125rem' },
  xl: { box: 80, text: '1.5rem' },
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({ name, avatarUrl, size = 'md' }: AvatarProps) {
  const { box, text } = sizeMap[size]

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width={box}
        height={box}
        style={{ width: box, height: box, borderRadius: '50%', objectFit: 'cover' }}
      />
    )
  }

  return (
    <span
      style={{
        width: box,
        height: box,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #2d8cf0, #141d5c)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: text,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
        letterSpacing: '0.05em',
      }}
    >
      {initials(name)}
    </span>
  )
}
