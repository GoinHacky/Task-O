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
    const supabase = await createServerSupabaseClient()
    const admin = getSupabaseAdmin()
    const { data: { user: inviter } } = await supabase.auth.getUser()

    if (!inviter) throw new Error('Unauthorized')

    // 0. Get inviter's full name
    const { data: inviterProfile } = await admin
        .from('users')
        .select('full_name')
        .eq('id', inviter.id)
        .single()

    const inviterName = inviterProfile?.full_name || inviter.email

    // 1. Find or "invite" user
    // Since we don't have a true workspace_members table, we'll use a platform-wide approach.
    // Check if user exists (case-insensitive)
    const { data: targetUser } = await admin
        .from('users')
        .select('id, full_name')
        .ilike('email', email)
        .single()

    // If user doesn't exist, in a real app we'd trigger an email invitation via Supabase Auth
    // For this demo, we'll assume they must exist or we just create a notification if they do.
    if (!targetUser) {
        throw new Error('User not found. For this version, users must already have an account.')
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
                throw new Error('User is already a member of this project.')
            } else if (existingMember.status === 'pending') {
                throw new Error('User already has a pending invitation to this project.')
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
            throw new Error(`Project admission failed: ${projectError.message}`)
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
    const { error: notifError } = await admin.from('notifications').insert({
        user_id: targetUser.id,
        type: 'invite',
        message: message || `You've been invited to join the workspace by ${inviterName}`,
        related_id: projectId || targetUser.id,
        read: false,
        metadata: projectId ? { project_name: (await admin.from('projects').select('name').eq('id', projectId).single()).data?.name } : undefined
    })

    if (notifError) console.error('Error sending notification:', notifError)

    revalidatePath('/members')
    if (projectId) revalidatePath(`/projects/${projectId}/members`)

    return { success: true }
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
