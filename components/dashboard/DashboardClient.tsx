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
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="px-4 py-2 bg-[#f3f4ff] text-[#6366f1] rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#e8e9ff] transition-colors"
                >
                    <Plus size={16} /> Task
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
                className="p-2 text-gray-300 hover:text-gray-500 transition-colors"
            >
                <MoreHorizontal size={22} />
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
        <div className="space-y-6">
            <div className="flex gap-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => setActiveTab(tab.label as any)}
                        className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab.label ? 'bg-[#f3f4ff] dark:bg-indigo-500/10 text-[#6366f1]' : 'bg-[#f8f9fa] dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        {tab.count} {tab.label === 'Completed' ? 'resolved' : tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-6 min-h-[300px]">
                {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-5 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-5 h-5 rounded-lg border-2 border-gray-100 dark:border-slate-800 group-hover:border-[#6366f1] transition-all cursor-pointer flex-shrink-0 bg-white dark:bg-slate-950" />
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[15px] font-bold text-gray-900 dark:text-slate-100 truncate group-hover:text-[#6366f1] transition-colors">{task.title}</h4>
                            <div className="mt-1.5 flex items-center gap-4 text-[12px] font-semibold text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} /> {task.due_date ? format(new Date(task.due_date), 'dd MMM yyyy - p') : 'No due date'}
                                </span>
                                {task.priority && (
                                    <span className={`flex items-center gap-1.5 capitalize px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${task.priority === 'high' ? 'bg-red-50 text-red-500 dark:bg-red-500/10' :
                                        task.priority === 'medium' ? 'bg-yellow-50 text-yellow-500 dark:bg-yellow-500/10' :
                                            'bg-green-50 text-green-500 dark:bg-green-500/10'
                                        }`}>
                                        <AlertCircle size={14} /> {task.priority}
                                    </span>
                                )}
                            </div>
                        </div>
                        <SectionDropdown />
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
