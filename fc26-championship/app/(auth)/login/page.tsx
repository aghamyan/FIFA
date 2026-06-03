import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/session'
import { LoginForm } from './LoginForm'

export default async function LoginPage() {
  const profile = await getSessionProfile()
  if (profile) {
    if (profile.role === 'super_admin' || profile.role === 'moderator') redirect('/admin')
    redirect('/dashboard')
  }
  return <LoginForm />
}
