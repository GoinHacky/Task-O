'use client'

import { useState } from 'react'
import { Search, Filter, Plus, ChevronDown, Layout, List } from 'lucide-react'
import TaskTimeline from '@/components/projects/TaskTimeline'
import TaskTable from '@/components/projects/TaskTable'
import TaskDetailDrawer from '@/components/projects/TaskDetailDrawer'
import { supabase } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import CreateTaskModal from '@/components/projects/CreateTaskModal'
import EditTaskModal from '@/components/projects/EditTaskModal'

interface ProjectTasksClientProps {
    projectId: string
    tasks: any[]
    canManage: boolean
}

export default function ProjectTasksClient({ projectId, tasks, canManage }: ProjectTasksClientProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<any | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [viewMode, setViewMode] = useState<'timeline' | 'table'>('table')

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
        return matchesSearch && matchesStatus && matchesPriority
    })

    return (
        <div className="space-y-10 pb-32">
            {/* Header / Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div className="relative group max-w-sm flex-1">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-[#6366f1] transition-colors">
                        <Search size={14} />
                    </span>
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-slate-100"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-[#6366f1] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Layout size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-800 text-[#6366f1] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List size={14} />
                        </button>
                    </div>

                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none focus:border-[#6366f1] transition-all cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">To Do</option>
                            <option value="in_progress">Doing</option>
                            <option value="completed">Done</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {canManage && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-2.5 bg-[#6366f1] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5558e3] transition-all flex items-center gap-2 shadow-lg shadow-[#6366f1]/20 active:scale-95"
                        >
                            <Plus size={16} /> New Task
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {viewMode === 'table' ? (
                    <TaskTable
                        tasks={filteredTasks}
                        onTaskClick={(task) => setSelectedTask(task)}
                    />
                ) : (
                    <TaskTimeline
                        tasks={filteredTasks}
                        onTaskClick={(task) => setSelectedTask(task)}
                    />
                )}
            </div>

            <Modal
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                title="Task Insight"
            >
                {selectedTask && (
                    <TaskDetailDrawer
                        task={selectedTask}
                        projectId={projectId}
                        canManage={canManage}
                        onClose={() => setSelectedTask(null)}
                    />
                )}
            </Modal>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                initialProjectId={projectId}
                onSuccess={() => window.location.reload()}
            />
        </div>
    )
}

