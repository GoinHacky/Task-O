'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, AlertCircle, Trash2, Calendar, User, Clock, Tag, ChevronDown } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { deleteTask } from '@/lib/tasks/actions'

interface Task {
    id: string
    title: string
    description?: string
    status: string
    priority: string
    due_date?: string
    due_time?: string
    task_tag?: string
    assigned_to?: string
    project_id: string
}

interface EditTaskModalProps {
    isOpen: boolean
    onClose: () => void
    task: Task
    onUpdate?: () => void
}

export default function EditTaskModal({ isOpen, onClose, task, onUpdate }: EditTaskModalProps) {
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description || '')
    const [status, setStatus] = useState(task.status)
    const [priority, setPriority] = useState(task.priority)
    const [dueDate, setDueDate] = useState(task.due_date || '')
    const [dueTime, setDueTime] = useState(task.due_time || '')
    const [taskTag, setTaskTag] = useState(task.task_tag || '')
    const [assignedTo, setAssignedTo] = useState(task.assigned_to || '')
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string>('viewer')

    const fetchMembers = useCallback(async () => {
        const { data } = await supabase
            .from('project_members')
            .select(`
                users:user_id (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('project_id', task.project_id)

        const memberList = data?.map((m: any) => m.users).filter(Boolean) || []
        setMembers(memberList)
    }, [task.project_id])

    useEffect(() => {
        if (isOpen) {
            setTitle(task.title)
            setDescription(task.description || '')
            setStatus(task.status)
            setPriority(task.priority)
            setDueDate(task.due_date || '')
            setDueTime(task.due_time || '')
            setTaskTag(task.task_tag || '')
            setAssignedTo(task.assigned_to || '')
            fetchMembers()

            // Fetch current user role
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    supabase
                        .from('project_members')
                        .select('role')
                        .eq('project_id', task.project_id)
                        .eq('user_id', user.id)
                        .single()
                        .then(({ data }) => {
                            setUserRole(data?.role || 'viewer')
                        })
                }
            })
        }
    }, [isOpen, task, fetchMembers])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const { error: updateError } = await supabase
                .from('tasks')
                .update({
                    title,
                    description,
                    status,
                    priority,
                    due_date: dueDate || null,
                    due_time: dueTime || null,
                    task_tag: taskTag || null,
                    assigned_to: assignedTo || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', task.id)

            if (updateError) throw updateError

            if (onUpdate) onUpdate()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to update task')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this task?')) return

        setDeleting(true)
        setError(null)
        try {
            await deleteTask(task.id)

            if (onUpdate) onUpdate()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to delete task')
            setDeleting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Update Task"
            helperText="Adjust mission parameters"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-900 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || deleting || !title}
                        className="flex-1 py-4 text-[10px] font-black text-[#6366f1] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </>
            }
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-600 animate-in slide-in-from-top-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Title *</label>
                        <input
                            required
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-100"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Assignee</label>
                            <div className="relative group">
                                <select
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-xs font-bold text-gray-900 dark:text-slate-100 appearance-none"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Priority</label>
                            <div className="relative group">
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-xs font-bold text-gray-900 dark:text-slate-100 appearance-none"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-xs font-bold text-gray-900 dark:text-slate-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Status</label>
                            <div className="relative group">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-xs font-bold text-gray-900 dark:text-slate-100 appearance-none"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-600 dark:text-slate-400 h-24 resize-none"
                            placeholder="Details regarding the initiative..."
                        />
                    </div>
                </div>

                {(userRole === 'admin' || userRole === 'manager') && (
                    <div className="pt-4 flex justify-center">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                            <Trash2 size={14} />
                            Delete Task
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    )
}
