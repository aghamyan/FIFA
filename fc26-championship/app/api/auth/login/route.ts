import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyAccessCode } from '@/lib/crypto'
import { createSession } from '@/lib/session'

// POST /api/auth/login
// Body: { accessCode: string }
// Scans all active profiles for a matching access code (O(n) by design — fine
// at friends-app scale). On match, creates a server session and sets httpOnly cookie.
export async function POST(req: NextRequest) {
  let body: { accessCode?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { accessCode } = body
  if (!accessCode || typeof accessCode !== 'string') {
    return NextResponse.json({ error: 'accessCode is required' }, { status: 400 })
  }

  const db = createAdminClient()

  const { data: profiles, error } = await db
    .from('profiles')
    .select('id, access_code_hash, status, role')
    .eq('status', 'active')

  if (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  let matchedId: string | null = null
  for (const p of profiles ?? []) {
    const match = await verifyAccessCode(accessCode, p.access_code_hash)
    if (match) {
      matchedId = p.id
      break
    }
  }

  // Same response whether not found or inactive — prevents enumeration
  if (!matchedId) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 })
  }

  await createSession(matchedId)

  return NextResponse.json({ success: true })
}
