'use server'


import { revalidatePath } from 'next/cache'

export async function inviteProjectMember(projectId: string, email: string, role: 'admin' | 'manager' | 'member') {
    try {
        const { createServerSupabaseClient } = require('@/lib/supabase/server')
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { error: 'Unauthorized' }

        // Check if current user is owner or admin of the project
        const { data: membership } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single()

        const { data: project } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', projectId)
            .single()

        if (project?.owner_id !== user.id && (!membership || membership.role !== 'admin')) {
            return { error: 'You do not have permission to invite members to this project' }
        }

        // Get inviter's full name and project name
        const { data: inviterProfile } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .single()

        const { data: projectInfo } = await supabase
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single()

        const inviterName = inviterProfile?.full_name || user.email
        const projectName = projectInfo?.name || 'a project'

        // Find user by email
        const { data: targetUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (!targetUser) {
            return { error: 'User with this email not found. They must have an account first.' }
        }

        // Add to project_members as pending
        const { data: existingMember } = await supabase
            .from('project_members')
            .select('status')
            .eq('project_id', projectId)
            .eq('user_id', targetUser.id)
            .single()

        if (existingMember) {
            if (existingMember.status === 'accepted') {
                return { error: 'User is already a member of this project' }
            } else {
                return { error: 'User already has a pending invitation to this project' }
            }
        }

        const { error } = await supabase
            .from('project_members')
            .insert({
                project_id: projectId,
                user_id: targetUser.id,
                role: role,
                status: 'pending'
            })

        if (error) {
            console.error('Error inserting project member:', error)
            return { error: error.message }
        }

        // Add notification for the target user
        await supabase.from('notifications').insert({
            user_id: targetUser.id,
            type: 'project_invite',
            message: `You've been invited to join "${projectName}" by ${inviterName}`,
            related_id: projectId,
            read: false,
            metadata: { project_name: projectName }
        })

        revalidatePath('/dashboard')
        revalidatePath('/projects')
        revalidatePath(`/projects/${projectId}`)
        revalidatePath(`/projects/${projectId}/teams`)
        
        return { success: true }
    } catch (err: any) {
        console.error('Unhandled error in inviteProjectMember:', err)
        return { error: err.message || 'An unexpected error occurred.' }
    }
}

export async function respondToProjectInvitation(projectId: string, accept: boolean) {
    const { createServerSupabaseClient } = require('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    if (accept) {
        const { error } = await supabase
            .from('project_members')
            .update({ status: 'accepted' })
            .eq('project_id', projectId)
            .eq('user_id', user.id)

        if (error) throw error
    } else {
        const { error } = await supabase
            .from('project_members')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', user.id)

        if (error) throw error
    }

    // Mark notifications as read or delete them
    await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('related_id', projectId)
        .eq('type', 'project_invite')

    revalidatePath('/dashboard')
    revalidatePath('/projects')
    revalidatePath('/notifications')
    revalidatePath(`/projects/${projectId}`)
}

export async function createProject(data: {
    name: string
    description?: string
    status?: string
    start_date?: string
    end_date?: string
}) {
    const { createServerSupabaseClient } = require('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
            name: data.name,
            description: data.description,
            owner_id: user.id,
            status: data.status || 'planning',
            start_date: data.start_date,
            end_date: data.end_date
        })
        .select()
        .single()

    if (projectError) throw projectError

    // Automatically add owner as admin member
    await supabase.from('project_members').insert({
        project_id: project.id,
        user_id: user.id,
        role: 'admin'
    })

    revalidatePath('/projects')
    return project
}

export async function updateProject(id: string, name: string, description: string) {
    const { createServerSupabaseClient } = require('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('projects')
        .update({ name, description, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('owner_id', user.id)

    if (error) throw error

    revalidatePath(`/projects/${id}`)
    revalidatePath(`/projects/${id}/settings`)
}

export async function deleteProject(id: string) {
    const { createServerSupabaseClient } = require('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id)

    if (error) throw error

    revalidatePath('/projects')
    revalidatePath('/dashboard')
}
