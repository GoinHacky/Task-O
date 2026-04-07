import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ProjectMembersClient from './ProjectMembersClient'

export default async function ProjectMembersPage({
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

    // Fetch project members with user details and counts
    const { data: members, error: membersError } = await supabase
        .from('project_members')
        .select(`
            id,
            role,
            status,
            joined_at,
            user:user_id (
                id,
                full_name,
                email,
                avatar_url,
                team_count:team_members(count),
                task_count:tasks!tasks_assigned_to_fkey(count)
            )
        `)
        .eq('project_id', id)
        .order('role', { ascending: true })

    if (membersError) {
        console.error('Error fetching members:', membersError)
    }
    console.log(`Fetched ${members?.length || 0} members for project ${id}`)

    // Fetch project owner for display
    const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', id)
        .single()

    const isOwner = project?.owner_id === user.id
    const isAdmin = members?.some(m =>
        (m.user as any)?.id === user.id &&
        m.role === 'admin' &&
        m.status === 'accepted'
    ) || isOwner

    return (
        <ProjectMembersClient
            projectId={id}
            members={members || []}
            isAdmin={isAdmin}
            currentUserId={user.id}
            ownerId={project?.owner_id || ''}
        />
    )
}
