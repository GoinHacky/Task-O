'use server'
import 'server-only'


import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activities/actions'

const supabaseAdmin = getSupabaseAdmin()

export async function createTask(data: {
    title: string
    description?: string
    status: string
    priority?: string
    due_date?: string
    due_time?: string
    project_id: string
    team_id?: string
    assigned_to?: string
}) {
    const { createServerSupabaseClient } = require('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Role-based validation
    const { data: member } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', data.project_id)
        .eq('user_id', user.id)
        .single()

    const role = member?.role || 'viewer'
    if (role === 'viewer') throw new Error('Insufficient permissions to create tasks')

    // Tech Lead validation: can only assign within their teams
    if (role === 'tech_lead' && data.assigned_to) {
        const { data: leadTeams } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)

        const leadTeamIds = leadTeams?.map((t: any) => t.team_id) || []

        const { data: isTeamMember } = await supabase
            .from('team_members')
            .select('id')
            .eq('user_id', data.assigned_to)
            .in('team_id', leadTeamIds)
            .maybeSingle()

        if (!isTeamMember) throw new Error('Tech Leads can only assign tasks to their own team members')
    }

    let isTeamAdmin = false

    if (data.team_id) {
        const { data: isTeamMember } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', data.team_id)
            .eq('user_id', user.id)
            .maybeSingle()

        if (!isTeamMember) throw new Error('You must be a member of the team to create tasks for it')

        if (isTeamMember.role === 'viewer') throw new Error('Viewers cannot create tasks')

        isTeamAdmin = ['admin', 'owner'].includes(isTeamMember.role)
    }

    // Member validation: can only assign to themselves
    if (role === 'member' && !isTeamAdmin && data.assigned_to && data.assigned_to !== user.id) {
        throw new Error('Members can only assign tasks to themselves')
    }

    const { data: task, error } = await supabase
        .from('tasks')
        .insert({
            ...data,
            created_by: user.id,
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) throw error

    // 2. Send Notification if assigned
    if (data.assigned_to) {
        const { data: project } = await supabaseAdmin.from('projects').select('name').eq('id', data.project_id).single()
        await supabaseAdmin.from('notifications').insert({
            user_id: data.assigned_to,
            type: 'task_assignment',
            message: `Assigned: ${data.title}`,
            related_id: task.id,
            read: false,
            metadata: { project_name: project?.name, due_date: data.due_date }
        })
    }

    // 3. Log Activity
    await logActivity({
        projectId: data.project_id,
        taskId: task.id,
        type: 'task_created',
        message: `Created task: ${data.title}`
    })

    revalidatePath(`/projects/${data.project_id}`)
    revalidatePath(`/projects/${data.project_id}/tasks`)
    revalidatePath('/dashboard')

    return task
}

export async function updateTask(taskId: string, data: any) {
    const { createServerSupabaseClient } = require('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Get original task and user role
    const { data: originalTask } = await supabase
        .from('tasks')
        .select('*, created_by, title, project_id, assigned_to, team_id')
        .eq('id', taskId)
        .single()

    if (!originalTask) throw new Error('Task not found')

    const { data: member } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', originalTask.project_id)
        .eq('user_id', user.id)
        .single()

    const role = member?.role || 'viewer'

    // 1b. Get team role if applicable
    let teamRole = 'viewer'
    if (originalTask.team_id) {
        const { data: teamMember } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', originalTask.team_id)
            .eq('user_id', user.id)
            .maybeSingle()
        if (teamMember) teamRole = teamMember.role
    }

    // 2. Permission enforcement
    if (role === 'admin' || role === 'manager') {
        // Full access
    } else if (teamRole === 'owner' || teamRole === 'admin' || teamRole === 'editor') {
        // Team-level full access (Editor can override even if not assigned)
    } else if (role === 'tech_lead') {
        // Must check if task belongs to one of their teams
        const { data: leadTeams } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)

        const leadTeamIds = leadTeams?.map((t: any) => t.team_id) || []
        if (!leadTeamIds.includes(originalTask.team_id)) {
            throw new Error('Tech Leads can only edit tasks within their teams')
        }

        // If updating assignee, must be within their team
        if (data.assigned_to && data.assigned_to !== originalTask.assigned_to) {
            const { data: isTeamMember } = await supabase
                .from('team_members')
                .select('id')
                .eq('user_id', data.assigned_to)
                .in('team_id', leadTeamIds)
                .maybeSingle()

            if (!isTeamMember) throw new Error('Tech Leads can only assign within their teams')
        }
    } else if (role === 'member' || teamRole === 'member') {
        // Can only edit if assigned to them
        if (originalTask.assigned_to !== user.id) {
            throw new Error('Members can only edit tasks assigned to them')
        }
        // Cannot change assignee
        if (data.assigned_to && data.assigned_to !== user.id) {
            throw new Error('Members cannot reassign tasks to others')
        }
    } else {
        throw new Error('Insufficient permissions')
    }

    const { error } = await supabase
        .from('tasks')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

    if (error) throw error

    // Notify new assignee if changed
    if (data.assigned_to && data.assigned_to !== originalTask.assigned_to && data.assigned_to !== user.id) {
        await supabaseAdmin.from('notifications').insert({
            user_id: data.assigned_to,
            type: 'task_assignment',
            message: `Assigned: ${originalTask.title}`,
            related_id: taskId,
            read: false
        })
    }

    // Notify creator and assignee if status changed
    if (data.status && data.status !== originalTask.status) {
        const statusLabel = data.status === 'in_progress' ? 'In Progress' :
            data.status === 'review' ? 'Review' :
                data.status === 'completed' ? 'Done' : 'Planning'

        let notificationMessage = `Update: ${originalTask.title} is now ${statusLabel}`

        if (data.status === 'completed' && originalTask.status === 'review') {
            notificationMessage = `Approved: ${originalTask.title} was marked as Done`
        } else if (data.status === 'in_progress' && originalTask.status === 'review') {
            notificationMessage = `Rejected: ${originalTask.title} needs more work`
        } else if (data.status === 'review') {
            notificationMessage = `Review Required: ${originalTask.title} is ready for review`
        }

        const { data: project } = await supabaseAdmin.from('projects').select('name').eq('id', originalTask.project_id).single()
        const metadata = { project_name: project?.name }

        // Notify creator
        if (originalTask.created_by && originalTask.created_by !== user.id) {
            await supabaseAdmin.from('notifications').insert({
                user_id: originalTask.created_by,
                type: 'task_status_change',
                message: notificationMessage,
                related_id: taskId,
                read: false,
                metadata
            })
        }

        // Notify assignee
        if (originalTask.assigned_to && originalTask.assigned_to !== user.id && originalTask.assigned_to !== originalTask.created_by) {
            await supabaseAdmin.from('notifications').insert({
                user_id: originalTask.assigned_to,
                type: 'task_status_change',
                message: notificationMessage,
                related_id: taskId,
                read: false,
                metadata
            })
        }

        // Notify admins/owners when moved to review
        if (data.status === 'review') {
            const { data: projectAdmins } = await supabaseAdmin
                .from('project_members')
                .select('user_id')
                .eq('project_id', originalTask.project_id)
                .in('role', ['admin', 'owner', 'manager'])

            if (projectAdmins) {
                const notifications = projectAdmins
                    .filter(a => a.user_id !== user.id && a.user_id !== originalTask.created_by && a.user_id !== originalTask.assigned_to)
                    .map(a => ({
                        user_id: a.user_id,
                        type: 'task_status_change',
                        message: notificationMessage,
                        related_id: taskId,
                        read: false,
                        metadata
                    }))

                if (notifications.length > 0) {
                    await supabaseAdmin.from('notifications').insert(notifications)
                }
            }
        }

        // Log status change activity
        let activityMsg = `Changed status to ${data.status}`
        if (data.status === 'completed' && originalTask.status === 'review') activityMsg = 'Approved the task'
        else if (data.status === 'in_progress' && originalTask.status === 'review') activityMsg = 'Rejected the task'
        else if (data.status === 'review') activityMsg = 'Submitted task for review'
        else if (data.status === 'completed') activityMsg = 'Marked task as done'
        else if (data.status === 'todo') activityMsg = 'Moved task to Pending'
        else if (data.status === 'in_progress') activityMsg = 'Started working on the task'

        await logActivity({
            projectId: originalTask.project_id,
            taskId: taskId,
            type: 'status_change',
            message: activityMsg,
            metadata: { from: originalTask.status, to: data.status }
        })
    } else {
        // Log generic update
        await logActivity({
            projectId: originalTask.project_id,
            taskId: taskId,
            type: 'task_updated',
            message: `Updated task parameters`
        })
    }

    revalidatePath('/dashboard')
    revalidatePath(`/projects/${originalTask.project_id}/tasks`)
}

export async function deleteTask(taskId: string) {
    const { createServerSupabaseClient } = require('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // 1. Check permissions
    const { data: task } = await supabase
        .from('tasks')
        .select('project_id, team_id, created_by')
        .eq('id', taskId)
        .single()

    if (task) {
        let isTeamAdmin = false

        if (task.team_id) {
            const { data: teamMember } = await supabase
                .from('team_members')
                .select('role')
                .eq('team_id', task.team_id)
                .eq('user_id', user.id)
                .maybeSingle()

            if (teamMember && (teamMember.role === 'admin' || teamMember.role === 'owner')) {
                isTeamAdmin = true
            }
        }

        const { data: member } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', task.project_id)
            .eq('user_id', user.id)
            .maybeSingle()

        const role = member?.role || 'viewer'

        const isCreator = task.created_by === user.id
        if (role !== 'admin' && role !== 'manager' && role !== 'tech_lead' && role !== 'owner' && !isTeamAdmin && !isCreator) {
            throw new Error('Only Project Admins, Managers, Tech Leads, or Team Admins can delete tasks.')
        }
    }

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

    if (error) throw error

    revalidatePath('/dashboard')
}

export async function bulkUpdateTaskStatus(taskIds: string[], newStatus: string, projectId: string) {
    const { createServerSupabaseClient } = require('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('tasks')
        .update({
            status: newStatus,
            updated_at: new Date().toISOString()
        })
        .in('id', taskIds)

    if (error) throw error

    await logActivity({
        projectId,
        type: 'bulk_status_change',
        message: `Bulk updated ${taskIds.length} tasks to ${newStatus}`,
        metadata: { count: taskIds.length, status: newStatus }
    })

    revalidatePath(`/projects/${projectId}/tasks`)
    revalidatePath('/dashboard')
}

export async function bulkDeleteTasks(taskIds: string[], projectId: string) {
    const { createServerSupabaseClient } = require('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', taskIds)

    if (error) throw error

    await logActivity({
        projectId,
        type: 'bulk_task_deletion',
        message: `Bulk deleted ${taskIds.length} tasks`,
        metadata: { count: taskIds.length }
    })

    revalidatePath(`/projects/${projectId}/tasks`)
    revalidatePath('/dashboard')
}
