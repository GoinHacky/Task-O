import { createServerSupabaseClient } from '@/lib/supabase/server'
import InviteFriendsClient from '@/components/InviteFriendsClient'
import { redirect } from 'next/navigation'

export default async function InvitePage() {
    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return <InviteFriendsClient user={user} />
}
