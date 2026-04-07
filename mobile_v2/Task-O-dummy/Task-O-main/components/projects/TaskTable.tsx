'use client'

import { format } from 'date-fns'
import { Calendar, User, Tag } from 'lucide-react'

interface Task {
    id: string
    title: string
    description?: string
    status: string
    priority: string
    due_date?: string
    assignee?: {
        full_name?: string
        email?: string
    }
    team?: {
        name: string
    }
}

interface TaskTableProps {
    tasks: Task[]
    onTaskClick: (task: Task) => void
}

export default function TaskTable({ tasks, onTaskClick }: TaskTableProps) {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed':
            case 'Done':
                return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
            case 'in_progress':
            case 'Doing':
                return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10'
            default:
                return 'bg-gray-50 text-gray-500 dark:bg-slate-800'
        }
    }

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'text-rose-500'
            case 'medium':
                return 'text-amber-500'
            case 'low':
                return 'text-blue-500'
            default:
                return 'text-gray-400'
        }
    }

    const formatLabel = (label: string) => {
        if (!label) return ''
        return label.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'To Do'
            case 'in_progress': return 'Doing'
            case 'completed': return 'Done'
            default: return formatLabel(status)
        }
    }

    return (
        <div className="w-full overflow-hidden bg-white dark:bg-slate-950 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-gray-50 dark:border-slate-800/50">
                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Task</th>
                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Team</th>
                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ownership</th>
                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timeline</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                    {tasks.map((task) => (
                        <tr
                            key={task.id}
                            onClick={() => onTaskClick(task)}
                            className="group hover:bg-gray-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer"
                        >
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[13px] font-black text-gray-900 dark:text-slate-100 group-hover:text-[#6366f1] transition-colors uppercase tracking-tight">
                                        {task.title}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${getPriorityStyle(task.priority).replace('text', 'bg')}`} />
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${getPriorityStyle(task.priority)}`}>
                                            {formatLabel(task.priority)}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                                    {formatLabel(task.team?.name || 'No Team')}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-[#6366f1] border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                        {task.assignee?.full_name?.[0] || 'U'}
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-600 dark:text-slate-300">
                                        {task.assignee?.full_name?.toUpperCase() || 'UNASSIGNED'}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${getStatusStyle(task.status)}`}>
                                    {getStatusLabel(task.status)}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500">
                                    <Calendar size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {task.due_date ? format(new Date(task.due_date), 'MMM dd') : 'TBD'}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {tasks.length === 0 && (
                <div className="py-12 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                    No active tasks found in current sector.
                </div>
            )}
        </div>
    )
}
