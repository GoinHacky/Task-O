'use client'

import { Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ConfirmationModal from './ui/ConfirmationModal'

export default function DeleteTaskButton({ taskId, projectId }: { taskId: string, projectId?: string }) {
    const router = useRouter()
    const [isConfirming, setIsConfirming] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleDelete = async () => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

        if (!error) {
            if (projectId) {
                router.push(`/projects/${projectId}`)
            } else {
                router.push('/tasks')
            }
            router.refresh()
        } else {
            setError(error.message)
        }
    }

    return (
        <div className="inline-block">
            <button
                className="inline-flex items-center px-6 py-2.5 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 transition-all active:scale-95"
                onClick={() => setIsConfirming(true)}
            >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
            </button>

            <ConfirmationModal
                isOpen={isConfirming}
                onClose={() => setIsConfirming(false)}
                onConfirm={handleDelete}
                title="Objective Termination"
                message="Are you sure you want to permanently delete this task? This data cannot be recovered once purged from the system."
                confirmLabel="Confirm Purge"
                type="danger"
            />

            <ConfirmationModal
                isOpen={!!error}
                onClose={() => setError(null)}
                onConfirm={() => setError(null)}
                title="System Conflict"
                message={error || 'An unknown error occurred during task deletion.'}
                confirmLabel="Acknowledge"
                type="warning"
            />
        </div>
    )
}
