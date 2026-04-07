import ActivityFeed from '@/components/ActivityFeed'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ActivitiesPage({ params }: { params: { id: string } }) {
    const { id: projectId } = params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check role
    const { data: membership } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .single()

    // Also check if owner
    const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single()

    const userRole = membership?.role || (project?.owner_id === user.id ? 'owner' : 'member')
    const isAllowed = userRole === 'admin' || userRole === 'owner'

    if (!isAllowed) {
        redirect(`/projects/${projectId}`)
    }

    // For admins, fetch their team IDs so we can filter activities
    let userTeamIds: string[] | undefined = undefined
    if (userRole === 'admin') {
        const { data: teamMemberships } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)

        userTeamIds = teamMemberships?.map(t => t.team_id) || []
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-slate-50 uppercase tracking-tightest">Mission History</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Real-time tactical operations log</p>
                </div>
            </div>

            <ActivityFeed projectId={projectId} userTeamIds={userTeamIds} />
        </div>
    )
}
