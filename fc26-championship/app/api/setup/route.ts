import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { hashAccessCode } from '@/lib/crypto'
import { getSessionProfile } from '@/lib/session'

// POST /api/setup
// Creates the first super_admin. Protected by SETUP_SECRET env var.
// Once a super_admin exists, only another super_admin can call this endpoint
// (to create additional admins).
export async function POST(req: NextRequest) {
  const setupSecret = process.env.SETUP_SECRET
  if (!setupSecret) {
    return NextResponse.json(
      { error: 'Setup is disabled. SETUP_SECRET is not configured.' },
      { status: 403 },
    )
  }

  let body: { secret?: string; displayName?: string; accessCode?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { secret, displayName, accessCode } = body

  if (!secret || !displayName || !accessCode) {
    return NextResponse.json(
      { error: 'secret, displayName, and accessCode are required' },
      { status: 400 },
    )
  }

  if (secret !== setupSecret) {
    return NextResponse.json({ error: 'Invalid setup secret' }, { status: 403 })
  }

  const db = createAdminClient()

  // Check if a super_admin already exists
  const { data: existing } = await db
    .from('profiles')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1)
    .single()

  if (existing) {
    // A super_admin exists — only an authenticated super_admin may add more
    const currentUser = await getSessionProfile()
    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json(
        {
          error:
            'A super_admin already exists. Log in as super_admin to create more.',
        },
        { status: 403 },
      )
    }
  }

  // Ensure access code is unique (bcrypt salts prevent DB-level uniqueness)
  const { data: allProfiles } = await db
    .from('profiles')
    .select('access_code_hash')

  if (allProfiles) {
    const bcrypt = await import('bcryptjs')
    for (const p of allProfiles) {
      if (await bcrypt.compare(accessCode, p.access_code_hash)) {
        return NextResponse.json(
          { error: 'Access code is already in use' },
          { status: 409 },
        )
      }
    }
  }

  const hash = await hashAccessCode(accessCode)

  const { data: profile, error } = await db
    .from('profiles')
    .insert({
      display_name: displayName,
      access_code_hash: hash,
      role: 'super_admin',
      status: 'active',
    })
    .select('id, display_name, role')
    .single()

  if (error) {
    return NextResponse.json(
      { error: `Failed to create admin: ${error.message}` },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    message: 'super_admin created successfully',
    profile: { id: profile.id, display_name: profile.display_name, role: profile.role },
  })
}
