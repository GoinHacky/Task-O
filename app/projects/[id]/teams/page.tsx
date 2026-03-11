import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import CreateTeamButton from '@/components/teams/CreateTeamButton'
import TeamTable from '@/components/projects/TeamTable'

export default async function ProjectTeamsPage({
    params,
}: {
    params: { id: string }
}) {
    const { id } = params
    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch teams with member counts and task counts
    const { data: teams } = await supabase
        .from('teams')
        .select(`
            *,
            members:team_members(count),
            tasks:tasks(count)
        `)
        .eq('project_id', id)
        .order('created_at', { ascending: false })

    // Check permissions
    const { data: membership } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .single()

    const isAdmin = ['admin', 'owner'].includes(membership?.role || '')

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-32">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[20px] font-black text-gray-900 dark:text-slate-50 tracking-tightest uppercase">Strategic Units</h2>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1 italic">Define specialized domains and responsibility centers</p>
                </div>
                {isAdmin && <CreateTeamButton initialProjectId={id} />}
            </div>

            <div className="bg-white dark:bg-slate-900/40 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm p-2 backdrop-blur-xl">
                <TeamTable teams={teams || []} projectId={id} currentUserId={user.id} isAdmin={isAdmin} />
            </div>
        </div>
    )
}
