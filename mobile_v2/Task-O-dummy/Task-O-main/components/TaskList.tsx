'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, Clock, AlertCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority?: string
  due_date?: string
  assigned_to?: string
  assignee?: {
    full_name?: string
    email?: string
  }
  created_at: string
}

interface TaskListProps {
  tasks: Task[]
  projectId?: string
}

export default function TaskList({ tasks, projectId }: TaskListProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No tasks yet. Create your first task!</p>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'pending':
        return <Circle className="h-5 w-5 text-gray-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20'
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/20'
      case 'low':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20'
      default:
        return 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
    }
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/tasks/${task.id}`}
          className="w-full text-left block bg-gray-50 dark:bg-slate-900/50 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-2xl p-5 transition-all border border-gray-100 dark:border-slate-800/50 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="mt-1">{getStatusIcon(task.status)}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#6366f1] transition-colors">{task.title}</h4>
                {task.description && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-slate-500 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                  {task.due_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(task.due_date), 'MMM dd, yyyy')}
                    </div>
                  )}
                  {task.assignee && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-[10px] text-[#6366f1]">
                        {task.assignee.full_name?.[0] || 'U'}
                      </div>
                      <span>
                        {task.assignee.full_name || task.assignee.email || 'Unassigned'}
                      </span>
                    </div>
                  )}
                  {task.priority && (
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
