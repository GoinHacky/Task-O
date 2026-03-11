'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTeam(
    name: string,
    description: string,
    projectId?: string,
    leadId?: string,
    memberUserIds?: string[],
    invitationEmails?: string[]
) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Create the team
    const { data: team, error } = await supabase
        .from('teams')
        .insert({
            name,
            description,
            owner_id: user.id,
            project_id: projectId
        })
        .select()
        .single()

    if (error) throw error

    // Create team members list
    const teamMembers = []

    // 1. Add owner (handled by DB trigger usually, but let's be explicit if needed or let trigger handle it)
    // The teams_schema.sql has a trigger handle_team_creation that adds owner as member.

    // 2. Add lead if provided
    if (leadId && leadId !== user.id) {
        teamMembers.push({
            team_id: team.id,
            user_id: leadId,
            role: 'admin' as const // Lead is admin by default
        })
    }

    // 3. Add members if provided
    if (memberUserIds && memberUserIds.length > 0) {
        memberUserIds.forEach(userId => {
            if (userId !== user.id && userId !== leadId) {
                teamMembers.push({
                    team_id: team.id,
                    user_id: userId,
                    role: 'member' as const
                })
            }
        })
    }

    if (teamMembers.length > 0) {
        const { error: memberError } = await supabase
            .from('team_members')
            .insert(teamMembers)

        if (memberError) console.error('Error adding team members:', memberError)
    }

    // Link to project if provided
    if (projectId) {
        await supabase
            .from('projects')
            .update({ team_id: team.id })
            .eq('id', projectId)
            .eq('owner_id', user.id)
    }

    // Send invitations if provided
    if (invitationEmails && invitationEmails.length > 0) {
        const inviteData = invitationEmails.map(email => ({
            team_id: team.id,
            email: email.trim(),
            role: 'member' as const,
            inviter_id: user.id
        }))

        await supabase.from('team_invitations').insert(inviteData)
    }

    revalidatePath('/teams')
    revalidatePath('/dashboard')
    if (projectId) {
        revalidatePath(`/projects/${projectId}`)
        revalidatePath(`/projects/${projectId}/teams`)
    }

    return team
}

export async function updateTeam(id: string, name: string, description: string) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('teams')
        .update({ name, description, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('owner_id', user.id) // Only owner can update for now, or check team_members

    if (error) throw error

    revalidatePath('/teams')
    revalidatePath(`/teams/${id}`)
}

export async function deleteTeam(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if user is team owner
    const { data: team } = await supabase
        .from('teams')
        .select('owner_id, project_id')
        .eq('id', id)
        .single()

    if (!team) throw new Error('Team not found')

    // Check if user is project admin/owner
    const { data: projectMembership } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', team.project_id)
        .eq('user_id', user.id)
        .single()

    const isProjectAdmin = ['admin', 'owner'].includes(projectMembership?.role || '')

    if (team.owner_id !== user.id && !isProjectAdmin) {
        throw new Error('Unauthorized: Only the team owner or project administrator can delete this unit')
    }

    const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)

    if (error) throw error

    revalidatePath('/teams')
}

export async function inviteMember(teamId: string, email: string, role: 'admin' | 'member') {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if current user is owner/admin
    const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new Error('You do not have permission to invite members')
    }

    const { error } = await supabase
        .from('team_invitations')
        .insert({
            team_id: teamId,
            email,
            role,
            inviter_id: user.id
        })

    if (error) throw error

    // Note: In a real production app, you would send an email here.
    revalidatePath(`/teams/${teamId}`)
}

export async function addTeamMember(teamId: string, userId: string, role: 'admin' | 'member' = 'member') {
    const supabase = await createServerSupabaseClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) throw new Error('Unauthorized')

    // Check permissions on the team
    const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', currentUser.id)
        .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new Error('Unauthorized assignment')
    }

    const { error } = await supabase
        .from('team_members')
        .insert({
            team_id: teamId,
            user_id: userId,
            role
        })

    if (error) throw error

    revalidatePath(`/teams/${teamId}`)
}

export async function removeMember(teamId: string, userId: string) {
    const supabase = await createServerSupabaseClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) throw new Error('Unauthorized')

    // Check permissions
    const { data: callerMembership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', currentUser.id)
        .single()

    if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
        throw new Error('Unauthorized')
    }

    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId)

    if (error) throw error

    revalidatePath(`/teams/${teamId}`)
}

export async function updateMemberRole(teamId: string, userId: string, role: 'admin' | 'member') {
    const supabase = await createServerSupabaseClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) throw new Error('Unauthorized')

    // Check permissions
    const { data: callerMembership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', currentUser.id)
        .single()

    if (!callerMembership || callerMembership.role !== 'owner') {
        throw new Error('Only the owner can change roles')
    }

    const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('team_id', teamId)
        .eq('user_id', userId)

    if (error) throw error

    revalidatePath(`/teams/${teamId}`)
}

export async function respondToInvitation(invitationId: string, status: 'accepted' | 'rejected') {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: invitation, error: fetchError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('id', invitationId)
        .ilike('email', user.email!)
        .single()

    if (fetchError || !invitation) throw new Error('Invitation not found')

    if (status === 'accepted') {
        // Add to members
        const { error: memberError } = await supabase
            .from('team_members')
            .insert({
                team_id: invitation.team_id,
                user_id: user.id,
                role: invitation.role
            })

        if (memberError) throw memberError
    }

    // Update invitation status
    const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ status })
        .eq('id', invitationId)

    if (updateError) throw updateError

    revalidatePath('/teams')
}
