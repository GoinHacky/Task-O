import { createServerSupabaseClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/80 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-800/50 rounded-[48px] p-2 md:p-4 shadow-xl shadow-indigo-100/10 dark:shadow-none backdrop-blur-2xl">
        <SettingsForm user={user} userProfile={userProfile} />
      </div>
    </div >
  )
}
