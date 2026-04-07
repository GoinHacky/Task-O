'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markNotificationAsRead(notificationId: string) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/notifications')
    revalidatePath('/dashboard')
}

export async function deleteNotification(notificationId: string) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/notifications')
    revalidatePath('/dashboard')
}

export async function markAllNotificationsAsRead() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

    if (error) throw error

    revalidatePath('/notifications')
    revalidatePath('/dashboard')
}

export async function clearAllNotifications() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/notifications')
    revalidatePath('/dashboard')
}
