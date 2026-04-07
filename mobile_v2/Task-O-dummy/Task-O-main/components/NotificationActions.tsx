'use client'

import { useState } from 'react'
import { Check, Trash2, Loader2 } from 'lucide-react'
import { markNotificationAsRead, deleteNotification } from '@/lib/notifications/actions'

interface NotificationActionsProps {
    notificationId: string
    isRead: boolean
}

export default function NotificationActions({ notificationId, isRead }: NotificationActionsProps) {
    const [isLoading, setIsLoading] = useState<'read' | 'delete' | null>(null)

    const handleMarkAsRead = async () => {
        setIsLoading('read')
        try {
            await markNotificationAsRead(notificationId)
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        } finally {
            setIsLoading(null)
        }
    }

    const handleDelete = async () => {
        setIsLoading('delete')
        try {
            await deleteNotification(notificationId)
        } catch (error) {
            console.error('Failed to delete notification:', error)
        } finally {
            setIsLoading(null)
        }
    }

    return (
        <div className="flex items-center gap-2">
            {!isRead && (
                <button
                    onClick={handleMarkAsRead}
                    disabled={isLoading !== null}
                    className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                    title="Mark as read"
                >
                    {isLoading === 'read' ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Check size={16} />
                    )}
                </button>
            )}
            <button
                onClick={handleDelete}
                disabled={isLoading !== null}
                className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all disabled:opacity-50"
                title="Delete notification"
            >
                {isLoading === 'delete' ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Trash2 size={16} />
                )}
            </button>
        </div>
    )
}
