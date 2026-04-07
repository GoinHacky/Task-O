import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ProjectSettingsClient from './ProjectSettingsClient'
import { AlertTriangle } from 'lucide-react'

export default async function ProjectSettingsPage({
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

    // Fetch project details
    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (!project) notFound()

    // Verify admin access (Owner only for deletion/full settings)
    const { data: membership } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .single()

    const isOwner = project.owner_id === user.id
    const isAdmin = membership?.role === 'admin' || isOwner

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900/40 rounded-[50px] border border-gray-100 dark:border-slate-800/50 backdrop-blur-xl">
                <AlertTriangle size={48} className="text-yellow-500 mb-6" />
                <h2 className="text-xl font-black text-gray-900 dark:text-slate-50 uppercase tracking-widest">Access Restricted</h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-widest">Only project administrators can modify configuration</p>
            </div>
        )
    }

    return <ProjectSettingsClient project={project} />
}
