import { createServerSupabaseClient } from '@/lib/supabase/server'
import SupportClient from './SupportClient'

export default async function SupportPage() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: requests } = await supabase
        .from('support_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return <SupportClient requests={requests || []} user={user} />
}
