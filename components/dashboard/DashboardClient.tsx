'use client'

import { useState } from 'react'
import { Plus, MoreHorizontal, Calendar, AlertCircle, Layout, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'
const CreateTaskModal = dynamic(() => import('@/components/projects/CreateTaskModal'), { ssr: false })
// import CreateTeamModal from '@/components/teams/CreateTeamModal' // To be created

export function DashboardActions() {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)

    return (
        <>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="px-4 py-2 bg-[#0077B6] text-white rounded-xl text-[13px] font-black flex items-center gap-2 hover:bg-[#0096C7] transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest"
                >
                    <Plus size={16} className="stroke-[3px]" /> Task
                </button>
            </div>
            <CreateTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} />
        </>
    )
}

export function TeamActions() {
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsTeamModalOpen(true)}
                className="px-5 py-2.5 bg-[#f3f4ff] text-[#6366f1] rounded-2xl font-bold text-sm hover:bg-[#e8e9ff] transition-all flex items-center gap-2"
            >
                <Plus size={18} /> Team
            </button>
            {/* <CreateTeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} /> */}
        </>
    )
}

export function SectionDropdown() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 px-2 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors"
            >
                <MoreHorizontal size={20} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-[#f3f4ff] hover:text-[#6366f1] transition-colors">
                        View Details
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-[#f3f4ff] hover:text-[#6366f1] transition-colors">
                        Refresh Data
                    </button>
                    <div className="h-px bg-gray-50 my-1 mx-2"></div>
                    <button className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-gray-50 transition-colors">
                        Settings
                    </button>
                </div>
            )}
        </div>
    )
}

export function TaskPriorityList({ tasks, completedCount, upcomingCount, overdueCount }: {
    tasks: any[],
    completedCount: number,
    upcomingCount: number,
    overdueCount: number
}) {
    const [activeTab, setActiveTab] = useState<'Upcoming' | 'Overdue' | 'Completed'>('Upcoming')

    const filteredTasks = tasks.filter(task => {
        if (activeTab === 'Completed') return task.status === 'completed'
        if (activeTab === 'Overdue') return task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
        if (activeTab === 'Upcoming') return task.status !== 'completed' && task.due_date && new Date(task.due_date) >= new Date()
        return false
    }).sort((a, b) => {
        if (activeTab === 'Upcoming') return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }).slice(0, 4)

    const tabs = [
        { label: 'Upcoming', count: upcomingCount },
        { label: 'Overdue', count: overdueCount },
        { label: 'Completed', count: completedCount }
    ]

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => setActiveTab(tab.label as any)}
                        className={`py-2.5 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === tab.label
                            ? 'bg-[#f3f4ff] dark:bg-indigo-500/15 text-[#6366f1] shadow-sm'
                            : 'bg-gray-50 dark:bg-slate-800/40 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        {tab.count} {tab.label === 'Completed' ? 'resolved' : tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-4 min-h-[300px]">
                {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mt-1 w-6 h-6 rounded-xl border-2 border-gray-100 dark:border-slate-800 group-hover:border-[#6366f1] transition-all cursor-pointer flex-shrink-0 bg-white dark:bg-slate-950 flex items-center justify-center shadow-sm">
                            <div className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-[#6366f1]/20 transition-all" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[16px] font-black text-gray-900 dark:text-slate-100 truncate group-hover:text-[#6366f1] transition-colors tracking-tight">{task.title}</h4>
                            <div className="mt-1 flex items-center gap-3 text-[11px] font-bold text-gray-400 dark:text-slate-500">
                                <span className="flex items-center gap-1.5 bg-gray-50/50 dark:bg-slate-800/30 px-2 py-1 rounded-lg">
                                    <Calendar size={13} className="text-gray-400" /> {task.due_date ? format(new Date(task.due_date), 'dd MMM yyyy - p') : 'No due date'}
                                </span>
                                {task.priority && (
                                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${task.priority === 'high' ? 'bg-red-50 text-red-500 dark:bg-red-500/10' :
                                        task.priority === 'medium' ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10' :
                                            'bg-green-50 text-green-500 dark:bg-green-500/10'
                                        }`}>
                                        <AlertCircle size={12} className="stroke-[3px]" /> {task.priority}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-1">
                            <SectionDropdown />
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Layout className="text-gray-300 dark:text-slate-700" size={24} />
                        </div>
                        <p className="text-gray-400 dark:text-slate-600 font-medium italic">No tasks found for this section</p>
                    </div>
                )}
            </div>
        </div>
    )
}
