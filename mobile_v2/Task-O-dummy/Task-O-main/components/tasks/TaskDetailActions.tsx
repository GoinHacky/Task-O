'use client'

import { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import EditTaskModal from '../projects/EditTaskModal'
import DeleteTaskModal from './DeleteTaskModal'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface TaskDetailActionsProps {
    task: any
}

export default function TaskDetailActions({ task }: TaskDetailActionsProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', task.id)

            if (error) throw error

            router.push(task.project_id ? `/projects/${task.project_id}` : '/dashboard')
            router.refresh()
        } catch (error) {
            console.error('Error deleting task:', error)
            alert('Failed to delete task')
        } finally {
            setLoading(false)
            setIsDeleteModalOpen(false)
        }
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#6366f1] text-white rounded-2xl hover:bg-[#5558e3] transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#6366f1]/20 active:scale-95"
            >
                <Edit size={16} />
                Edit Task
            </button>

            <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
            >
                <Trash2 size={16} />
                Delete
            </button>

            <EditTaskModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                task={task}
                onUpdate={() => {
                    setIsEditModalOpen(false)
                    router.refresh()
                }}
            />

            <DeleteTaskModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                taskTitle={task.title}
                loading={loading}
            />
        </div>
    )
}
