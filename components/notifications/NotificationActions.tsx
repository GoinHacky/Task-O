'use client'

import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { markNotificationAsRead, deleteNotification } from '@/lib/notifications/actions'

interface NotificationActionsProps {
    notificationId: string
    isRead: boolean
}

export default function NotificationActions({ notificationId, isRead }: NotificationActionsProps) {
    const [loading, setLoading] = useState(false)

    const handleMarkAsRead = async () => {
        setLoading(true)
        try {
            await markNotificationAsRead(notificationId)
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this notification?')) return

        setLoading(true)
        try {
            await deleteNotification(notificationId)
        } catch (error) {
            console.error('Failed to delete notification:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            {!isRead && (
                <button
                    disabled={loading}
                    onClick={handleMarkAsRead}
                    className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all disabled:opacity-50"
                    title="Mark as read"
                >
                    <Check size={18} />
                </button>
            )}
            <button
                disabled={loading}
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
                title="Delete notification"
            >
                <Trash2 size={18} />
            </button>
        </div>
    )
}
