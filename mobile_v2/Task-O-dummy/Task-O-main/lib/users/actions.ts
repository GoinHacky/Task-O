'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function inviteUserToWorkspace(
    email: string,
    role: 'admin' | 'member' | 'viewer',
    teamIds?: string[],
    projectId?: string,
    message?: string
) {
    try {
        const supabase = await createServerSupabaseClient()
        const admin = getSupabaseAdmin()

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('SERVER: SUPABASE_SERVICE_ROLE_KEY is missing.')
            return { error: 'Server configuration error: missing service role key.' }
        }

        const { data: { user: inviter } } = await supabase.auth.getUser()
        if (!inviter) return { error: 'Unauthorized' }

        // 0. Get inviter's full name
        const { data: inviterProfile } = await admin
            .from('users')
            .select('full_name')
            .eq('id', inviter.id)
            .single()

        const inviterName = inviterProfile?.full_name || inviter.email || 'A team member'

        // 1. Find or "invite" user
        // Check if user exists (case-insensitive)
        const { data: targetUser, error: findError } = await admin
            .from('users')
            .select('id, full_name')
            .ilike('email', email)
            .single()

        if (findError || !targetUser) {
            return { error: 'User not found. Users must already have an account to be invited.' }
        }

        // 1.5 Check if already a member or pending
        if (projectId) {
            const { data: existingMember } = await admin
                .from('project_members')
                .select('status')
                .eq('project_id', projectId)
                .eq('user_id', targetUser.id)
                .single()

            if (existingMember) {
                if (existingMember.status === 'accepted') {
                    return { error: 'User is already a member of this project.' }
                } else if (existingMember.status === 'pending') {
                    return { error: 'User already has a pending invitation to this project.' }
                }
            }
        }

        // 2. Add to project if projectId is provided
        if (projectId) {
            const { error: projectError } = await admin
                .from('project_members')
                .upsert({
                    project_id: projectId,
                    user_id: targetUser.id,
                    role: role === 'viewer' ? 'member' : role,
                    status: 'pending'
                }, { onConflict: 'project_id,user_id' })

            if (projectError) {
                console.error('Error adding to project:', projectError)
                return { error: `Project admission failed: ${projectError.message}` }
            }
        }

        // 3. Add to teams if provided
        if (teamIds && teamIds.length > 0) {
            const teamMembers = teamIds.map(teamId => ({
                team_id: teamId,
                user_id: targetUser.id,
                role: 'member' as const
            }))

            const { error: teamError } = await admin
                .from('team_members')
                .insert(teamMembers)

            if (teamError) console.error('Error adding to teams:', teamError)
        }

        // 4. Send Notification
        let projectName = 'the project'
        if (projectId) {
            const { data: projData } = await admin
                .from('projects')
                .select('name')
                .eq('id', projectId)
                .single()
            if (projData) projectName = projData.name
        }

        const { error: notifError } = await admin.from('notifications').insert({
            user_id: targetUser.id,
            type: 'invite',
            message: message || `You've been invited to join ${projectName} by ${inviterName}`,
            related_id: projectId || targetUser.id,
            read: false,
            metadata: { project_name: projectName }
        })

        if (notifError) console.error('Error sending notification:', notifError)

        revalidatePath('/dashboard')
        if (projectId) revalidatePath(`/projects/${projectId}/members`)

        return { success: true }
    } catch (err: any) {
        console.error('Unhandled error in inviteUserToWorkspace:', err)
        return { error: err.message || 'An unexpected error occurred during the invitation.' }
    }
}

export async function respondToPlatformInvitation(projectId: string, accept: boolean) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    if (accept) {
        const { error } = await supabase
            .from('project_members')
            .update({ status: 'accepted', joined_at: new Date().toISOString() })
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
        .in('type', ['workspace_invite', 'project_invite', 'invite'])

    revalidatePath('/inbox')
    revalidatePath('/dashboard')
    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/members`)

    return { success: true }
}
