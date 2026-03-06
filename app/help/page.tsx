import { createServerSupabaseClient } from '@/lib/supabase/server'
import HelpSupportClient from '@/components/HelpSupportClient'
import { redirect } from 'next/navigation'

export default async function HelpPage() {
    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return <HelpSupportClient user={user} />
}
