'use client'

import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { markNotificationAsRead, deleteNotification } from '@/lib/notifications/actions'
import ConfirmationModal from '../ui/ConfirmationModal'

interface NotificationActionsProps {
    notificationId: string
    isRead: boolean
}

export default function NotificationActions({ notificationId, isRead }: NotificationActionsProps) {
    const [loading, setLoading] = useState(false)
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

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
                onClick={() => setIsConfirmingDelete(true)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
                title="Delete notification"
            >
                <Trash2 size={18} />
            </button>

            <ConfirmationModal
                isOpen={isConfirmingDelete}
                onClose={() => setIsConfirmingDelete(false)}
                onConfirm={handleDelete}
                title="Dispose Notification"
                message="Are you sure you want to remove this update from your feed? This action cannot be undone."
                confirmLabel="Delete"
                type="danger"
            />
        </div>
    )
}
