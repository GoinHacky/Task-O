'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, MoreVertical, User, AlertCircle, ChevronRight } from 'lucide-react'

interface Task {
    id: string
    title: string
    description?: string
    status: string
    priority: string
    due_date?: string
    assignee?: {
        full_name?: string
        avatar_url?: string
        email?: string
    }
}

interface TaskTimelineProps {
    tasks: Task[]
    onTaskClick: (task: Task) => void
}

export default function TaskTimeline({ tasks, onTaskClick }: TaskTimelineProps) {
    const statuses = [
        { id: 'pending', label: 'Queue', icon: Circle, color: 'text-gray-400', bg: 'bg-gray-400/10' },
        { id: 'in_progress', label: 'Active', icon: Clock, color: 'text-[#6366f1]', bg: 'bg-[#6366f1]/10' },
        { id: 'completed', label: 'Done', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    ]

    const getTasksByStatus = (status: string) => {
        return tasks.filter(t => t.status === status)
    }

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-500'
            case 'medium': return 'bg-amber-500'
            case 'low': return 'bg-emerald-500'
            default: return 'bg-gray-400'
        }
    }

    return (
        <div className="flex overflow-x-auto pb-8 scrollbar-hide snap-x gap-6 px-1">
            {statuses.map((status) => (
                <div
                    key={status.id}
                    className="flex-shrink-0 w-[320px] sm:w-[380px] snap-start"
                >
                    <div className="flex items-center justify-between mb-6 px-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl ${status.bg} flex items-center justify-center ${status.color}`}>
                                <status.icon size={16} />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-slate-50">
                                {status.label}
                                <span className="ml-2 py-0.5 px-2 bg-gray-100 dark:bg-slate-800 rounded-full text-[9px] text-gray-400">
                                    {getTasksByStatus(status.id).length}
                                </span>
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {getTasksByStatus(status.id).map((task) => (
                            <div
                                key={task.id}
                                onClick={() => onTaskClick(task)}
                                className="group bg-white dark:bg-slate-950/40 p-5 rounded-[24px] border border-gray-100 dark:border-slate-800/50 hover:border-[#6366f1]/30 hover:shadow-xl hover:shadow-[#6366f1]/5 transition-all cursor-pointer relative overflow-hidden"
                            >
                                {/* Priority Indicator */}
                                <div className={`absolute top-0 left-0 bottom-0 w-1 ${getPriorityColor(task.priority)} opacity-40 group-hover:opacity-100 transition-opacity`} />

                                <div className="space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <h4 className="text-[13px] font-black text-gray-900 dark:text-slate-50 leading-tight tracking-tight uppercase group-hover:text-[#6366f1] transition-colors">
                                            {task.title}
                                        </h4>
                                    </div>

                                    {task.description && (
                                        <p className="text-[10px] font-medium text-gray-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                                            {task.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-gray-50 dark:bg-slate-900 flex items-center justify-center border border-gray-100 dark:border-slate-800">
                                                {task.assignee?.avatar_url ? (
                                                    <img src={task.assignee.avatar_url} alt={task.assignee.full_name || 'Assignee'} className="w-full h-full object-cover rounded-lg" />
                                                ) : (
                                                    <User size={10} className="text-gray-400" />
                                                )}
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 truncate max-w-[80px]">
                                                {task.assignee?.full_name?.split(' ')[0] || 'Unassigned'}
                                            </span>
                                        </div>

                                        {task.due_date && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-100 dark:border-slate-800">
                                                <Clock size={10} className="text-gray-400" />
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                                                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {getTasksByStatus(status.id).length === 0 && (
                            <div className="border-2 border-dashed border-gray-50 dark:border-slate-800/20 rounded-[32px] p-12 flex flex-col items-center justify-center text-center">
                                <p className="text-[10px] font-black text-gray-300 dark:text-slate-700 uppercase tracking-[0.2em]">Void</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
