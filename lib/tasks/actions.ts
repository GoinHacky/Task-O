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

    // Member validation: can only assign to themselves
    if (role === 'member' && data.assigned_to && data.assigned_to !== user.id) {
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

    // 2. Permission enforcement
    if (role === 'admin' || role === 'manager') {
        // Full access
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
    } else if (role === 'member') {
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

        const notificationMessage = `Update: ${originalTask.title} is now ${statusLabel}`

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

        // Log status change activity
        await logActivity({
            projectId: originalTask.project_id,
            taskId: taskId,
            type: 'status_change',
            message: `Changed status from ${originalTask.status} to ${data.status}`,
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
        .select('project_id')
        .eq('id', taskId)
        .single()

    if (task) {
        const { data: member } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', task.project_id)
            .eq('user_id', user.id)
            .single()

        if (member?.role !== 'admin' && member?.role !== 'manager') {
            throw new Error('Only Admins or Managers can delete tasks')
        }
    }

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

    if (error) throw error

    revalidatePath('/dashboard')
}
