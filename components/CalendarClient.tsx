'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    parseISO
} from 'date-fns'
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Filter,
    Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import TaskDetailDrawer from './projects/TaskDetailDrawer'
import CreateTaskModal from './projects/CreateTaskModal'
import Modal from './ui/Modal'

interface Task {
    id: string
    title: string
    due_date: string
    priority: string
    status: string
    project_id: string
    project?: { name: string }
}

interface CalendarClientProps {
    projectId?: string // Optional for global view
    userId: string
}

export default function CalendarClient({ projectId, userId }: CalendarClientProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)

        let query = supabase
            .from('tasks')
            .select(`
                *,
                project:projects(name)
            `)
            .gte('due_date', monthStart.toISOString())
            .lte('due_date', monthEnd.toISOString())

        if (projectId) {
            query = query.eq('project_id', projectId)
        }

        const { data } = await query

        if (data) {
            setTasks(data)
        }
        setLoading(false)
    }, [currentMonth, projectId])

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    const onDateClick = (day: Date) => {
        setSelectedDate(day)
        setIsCreateModalOpen(true)
    }

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0077B6]/10 flex items-center justify-center text-[#0077B6]">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                            {tasks.length} tasks this month
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-all active:scale-95"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#0077B6] hover:bg-[#0077B6]/10 rounded-xl transition-all"
                    >
                        Today
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-all active:scale-95"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        )
    }

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        return (
            <div className="grid grid-cols-7 mb-4">
                {days.map((day, i) => (
                    <div key={i} className="text-center text-[10px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-widest py-2">
                        {day}
                    </div>
                ))}
            </div>
        )
    }

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        const startDate = startOfWeek(monthStart)
        const endDate = endOfWeek(monthEnd)

        const rows = []
        let days = []
        let day = startDate
        let formattedDate = ''

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd')
                const cloneDay = day
                const dayTasks = tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), cloneDay))

                const isCurrentMonth = isSameMonth(day, monthStart)
                const isToday = isSameDay(day, new Date())

                days.push(
                    <div
                        key={day.toString()}
                        className={`min-h-[120px] p-2 border-t border-l border-gray-300 dark:border-slate-800/50 transition-all relative group
                            ${!isCurrentMonth ? 'bg-gray-50/30 dark:bg-slate-950/10' : 'bg-white dark:bg-slate-900/40'}
                            ${i === 6 ? 'border-r' : ''}
                            ${day >= startOfWeek(monthEnd) ? 'border-b' : ''}
                        `}
                        onClick={() => onDateClick(cloneDay)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-black ${isToday
                                ? 'w-7 h-7 bg-[#0077B6] text-white rounded-lg flex items-center justify-center shadow-lg shadow-[#0077B6]/20'
                                : isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-300 dark:text-slate-700'
                                }`}>
                                {formattedDate}
                            </span>
                            <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-[#0077B6] transition-opacity">
                                <Plus size={14} />
                            </button>
                        </div>

                        <div className="space-y-1.5 overflow-y-auto max-h-[80px] scrollbar-hide">
                            {dayTasks.map((task) => (
                                <div
                                    key={task.id}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedTask(task)
                                        setIsTaskDrawerOpen(true)
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold truncate cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm
                                        ${task.priority === 'urgent' ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                                            task.priority === 'high' ? 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' :
                                                'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'}
                                    `}
                                >
                                    {!projectId && task.project && (
                                        <span className="opacity-60 mr-1">[{task.project.name}]</span>
                                    )}
                                    {task.title}
                                </div>
                            ))}
                        </div>

                        {dayTasks.length > 3 && (
                            <div className="absolute bottom-1 right-2 text-[8px] font-black text-[#0077B6] uppercase">
                                +{dayTasks.length - 3} more
                            </div>
                        )}
                    </div>
                )
                day = addDays(day, 1)
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            )
            days = []
        }
        return <div className="rounded-[32px] overflow-hidden border border-gray-300 dark:border-slate-800 shadow-xl shadow-gray-100/20 dark:shadow-none">{rows}</div>
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {renderHeader()}
            <div className="bg-white dark:bg-slate-900/60 rounded-[48px] border border-gray-300 dark:border-slate-800 p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none backdrop-blur-xl relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#0077B6]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    {renderDays()}
                    {renderCells()}
                </div>
            </div>

            {selectedTask && (
                <Modal
                    isOpen={isTaskDrawerOpen}
                    onClose={() => {
                        setIsTaskDrawerOpen(false)
                        setSelectedTask(null)
                    }}
                    title="Task Details"
                >
                    <TaskDetailDrawer
                        task={selectedTask}
                        projectId={selectedTask.project_id || projectId || ''}
                        onClose={() => {
                            setIsTaskDrawerOpen(false)
                            setSelectedTask(null)
                        }}
                    />
                </Modal>
            )}

            {isCreateModalOpen && (
                <CreateTaskModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={fetchTasks}
                    initialProjectId={projectId}
                />
            )}
        </div>
    )
}
