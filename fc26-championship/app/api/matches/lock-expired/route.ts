import { NextRequest, NextResponse } from 'next/server'
import { lockExpiredMatches } from '@/lib/actions/matches'

// Manual trigger endpoint — can also be wired to a Vercel cron job:
// vercel.json: { "crons": [{ "path": "/api/matches/lock-expired", "schedule": "0 * * * *" }] }
// Secure with CRON_SECRET env var when deploying.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const result = await lockExpiredMatches()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
