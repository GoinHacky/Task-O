import { createServerSupabaseClient } from '@/lib/supabase/server'
import SettingsProfileClient from '@/components/SettingsProfileClient'
import { redirect } from 'next/navigation'

export default async function SettingsProfilePage() {
    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    return <SettingsProfileClient user={user} userProfile={userProfile} />
}
