'use server'



export async function logActivity({
    projectId,
    taskId,
    type,
    message,
    metadata = {}
}: {
    projectId: string
    taskId?: string
    type: string
    message: string
    metadata?: any
}) {
    const { createServerSupabaseClient } = require('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return // Don't fail the main action if logging fails or user is missing

    const { error } = await supabase.from('activities').insert({
        project_id: projectId,
        user_id: user.id,
        task_id: taskId,
        type,
        message,
        metadata
    })

    if (error) {
        console.error('Failed to log activity:', error)
    }
}
