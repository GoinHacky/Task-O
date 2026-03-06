'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitSupportRequest(formData: {
    title: string
    category: string
    where_did_it_happen: string
    severity: string
    description: string
    steps_to_reproduce?: string
    expected_result?: string
    screenshot_url?: string
    page_url?: string
    browser_info?: any
}) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('support_requests')
        .insert({
            ...formData,
            user_id: user.id,
            status: 'Open'
        })
        .select('ticket_id')
        .single()

    if (error) {
        console.error('Error submitting support request:', error)
        throw new Error(error.message)
    }

    // Log activity
    await supabase.from('support_activity_log').insert({
        request_id: (await supabase.from('support_requests').select('id').eq('ticket_id', data.ticket_id).single()).data?.id,
        user_id: user.id,
        action: 'Created',
        to_value: 'Open'
    })

    revalidatePath('/support')
    return { success: true, ticket_id: data.ticket_id }
}

export async function addSupportComment(requestId: string, content: string, isAdminNote: boolean = false) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('support_comments')
        .insert({
            request_id: requestId,
            user_id: user.id,
            content,
            is_admin_note: isAdminNote
        })

    if (error) {
        console.error('Error adding comment:', error)
        throw new Error(error.message)
    }

    // Log activity
    await supabase.from('support_activity_log').insert({
        request_id: requestId,
        user_id: user.id,
        action: 'Comment Added',
        to_value: isAdminNote ? 'Admin Note' : 'Public Comment'
    })

    revalidatePath(`/support/${requestId}`)
    revalidatePath(`/admin/support/${requestId}`)
    return { success: true }
}

export async function updateSupportStatus(requestId: string, status: string) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Only admins can update status (RLS will check this too, but good to check here)
    const { data: profile } = await supabase.from('users').select('is_platform_admin').eq('id', user.id).single()
    if (!profile?.is_platform_admin) throw new Error('Forbidden')

    const { data: oldRequest } = await supabase.from('support_requests').select('status').eq('id', requestId).single()

    const { error } = await supabase
        .from('support_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId)

    if (error) {
        console.error('Error updating status:', error)
        throw new Error(error.message)
    }

    // Log activity
    await supabase.from('support_activity_log').insert({
        request_id: requestId,
        user_id: user.id,
        action: 'Status Update',
        from_value: oldRequest?.status,
        to_value: status
    })

    revalidatePath(`/support/${requestId}`)
    revalidatePath(`/admin/support/${requestId}`)
    revalidatePath('/admin/support')
    return { success: true }
}

export async function updateSupportSeverity(requestId: string, severity: string) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase.from('users').select('is_platform_admin').eq('id', user.id).single()
    if (!profile?.is_platform_admin) throw new Error('Forbidden')

    const { data: oldRequest } = await supabase.from('support_requests').select('severity').eq('id', requestId).single()

    const { error } = await supabase
        .from('support_requests')
        .update({ severity, updated_at: new Date().toISOString() })
        .eq('id', requestId)

    if (error) {
        console.error('Error updating severity:', error)
        throw new Error(error.message)
    }

    // Log activity
    await supabase.from('support_activity_log').insert({
        request_id: requestId,
        user_id: user.id,
        action: 'Severity Update',
        from_value: oldRequest?.severity,
        to_value: severity
    })

    revalidatePath(`/support/${requestId}`)
    revalidatePath(`/admin/support/${requestId}`)
    return { success: true }
}

export async function getSupportAnalytics() {
    const supabase = await createServerSupabaseClient()

    // We'll fetch basic counts for analytics
    const { data: requests } = await supabase.from('support_requests').select('category, severity, status, created_at, where_did_it_happen')

    if (!requests) return null

    return requests
}
