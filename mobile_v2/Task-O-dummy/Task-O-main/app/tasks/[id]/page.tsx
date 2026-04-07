import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, Shield, Info, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import TaskDetailActions from '@/components/tasks/TaskDetailActions'

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: task } = await supabase
    .from('tasks')
    .select(`
      *,
      project:project_id (
        id,
        name
      ),
      assignee:assigned_to (
        id,
        full_name,
        email
      ),
      creator:created_by (
        id,
        full_name,
        email
      )
    `)
    .eq('id', params.id)
    .single()

  if (!task) {
    notFound()
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20'
      case 'low': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20'
      default: return 'text-gray-400 bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-800/50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-xl text-green-500"><Shield size={20} /></div>
      case 'in_progress': return <div className="p-2 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl text-yellow-600"><Clock size={20} /></div>
      default: return <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-xl text-gray-400"><AlertCircle size={20} /></div>
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header Area */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <Link href={task.project_id ? `/projects/${task.project_id}` : '/dashboard'} className="hover:text-[#6366f1] transition-colors flex items-center gap-1.5">
            <ArrowLeft size={12} /> {task.project?.name || 'Dashboard'}
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-900 dark:text-slate-100">Task Detail</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-gray-100 dark:border-slate-800/50">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(task.status)}
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{task.status.replace('_', ' ')}</span>
            </div>
            <h1 className="text-[40px] font-black text-gray-900 dark:text-slate-50 tracking-tightest leading-none uppercase mb-2">
              {task.title}
            </h1>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] italic">
              Assignment ID: {task.id.substring(0, 8).toUpperCase()}
            </p>
          </div>

          <TaskDetailActions task={task} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white dark:bg-slate-900/40 p-10 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-6">
              <Info size={16} className="text-[#6366f1]" />
              <h2 className="text-[14px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-widest leading-none">Objective & Context</h2>
            </div>
            <div className="text-[15px] text-gray-600 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-wrap italic">
              {task.description || 'No detailed context provided for this objective.'}
            </div>
          </section>
        </div>

        {/* Sidebar Details */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
            <h3 className="text-[12px] font-black text-gray-900 dark:text-slate-50 mb-8 uppercase tracking-widest border-b border-gray-50 dark:border-slate-800/50 pb-4">Metadata</h3>

            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</span>
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
                  {task.priority || 'standard'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assignee</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[10px] text-[#6366f1] font-black">
                    {task.assignee?.full_name?.[0] || 'U'}
                  </div>
                  <span className="text-[11px] font-black text-gray-900 dark:text-slate-200">
                    {task.assignee?.full_name || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deadline</span>
                <div className="flex items-center gap-2 text-gray-900 dark:text-slate-200">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-[11px] font-black">
                    {task.due_date ? format(new Date(task.due_date), 'MMM dd, yyyy') : 'No Deadline'}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-50 dark:border-slate-800/50 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Created By</span>
                  <span className="text-[10px] font-black text-gray-600 dark:text-slate-400">{task.creator?.full_name || 'System'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logged On</span>
                  <span className="text-[10px] font-black text-gray-600 dark:text-slate-400 uppercase tracking-widest">
                    {format(new Date(task.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
