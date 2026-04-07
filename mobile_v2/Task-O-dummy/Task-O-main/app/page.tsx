// app/page.tsx
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Logged-in users go to dashboard
    redirect('/dashboard')
  } else {
    // Guests go to landing page
    redirect('/landing')
  }
}
