import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ProjectTasksClient from './ProjectTasksClient'

export default async function ProjectTasksPage({
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

    // Fetch project membership for role
    const { data: membership } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .single()

    const canManage = membership?.role === 'admin' || membership?.role === 'manager' || membership?.role === 'owner'

    // Fetch all tasks for this project
    const { data: tasks } = await supabase
        .from('tasks')
        .select(`
      *,
      teams:team_id (
        name
      ),
      assignee:assigned_to (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
        .eq('project_id', id)
        .order('created_at', { ascending: false })

    return (
        <ProjectTasksClient
            projectId={id}
            tasks={tasks || []}
            canManage={canManage}
        />
    )
}
