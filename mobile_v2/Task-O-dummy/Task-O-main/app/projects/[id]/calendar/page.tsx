import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarClient from '@/components/CalendarClient'

export default async function ProjectCalendarPage({
    params,
}: {
    params: { id: string }
}) {
    const { id: projectId } = params
    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="animate-in fade-in duration-500">
            <CalendarClient projectId={projectId} userId={user.id} />
        </div>
    )
}
