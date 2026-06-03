import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'

export default async function HomePage() {
  const profile = await getSessionProfile()
  if (!profile) redirect('/login')
  if (profile.role === 'super_admin' || profile.role === 'moderator') {
    redirect('/admin')
  }
  redirect('/dashboard')
}
