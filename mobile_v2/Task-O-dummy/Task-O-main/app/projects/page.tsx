'use client'

import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, FolderKanban, Clock, Layout, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect, useCallback } from 'react'
import CreateProjectModal from '@/components/projects/CreateProjectModal'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('projects')
      .select(`*, project_members!inner(role)`)
      .eq('project_members.user_id', user.id)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-7 h-7 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
      />

      <div className="flex-1 bg-white dark:bg-[#111318] rounded-2xl border border-gray-300 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">Projects</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.18em] italic mt-1">
              Manage and track all collaborative projects.
            </p>
          </div>
          <button
            id="tour-create-project-btn"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#0077B6] hover:bg-[#0096C7] text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-95 text-[12px] font-black uppercase tracking-widest"
          >
            <Plus size={14} strokeWidth={3} /> New Project
          </button>
        </div>

        {/* Cards — single 3-col grid, all cards identical size */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {projects.length === 0 ? (
            <EmptyState onNew={() => setIsModalOpen(true)} />
          ) : (
            /*
              ONE grid, 3 columns always.
              Row 1 fills all 3 slots.
              Row 2 fills only 2 slots — the 3rd slot is naturally empty.
              Every card is h-[148px] fixed so all are identical size.
            */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {projects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
      <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-600 mb-5">
        <FolderKanban size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No projects yet</h3>
      <p className="text-slate-500 text-sm text-center max-w-xs mb-6">Get started by creating your first project.</p>
      <button id="tour-create-project-btn" onClick={onNew} className="px-5 py-2.5 bg-[#0077B6] hover:bg-[#0096C7] text-white rounded-xl transition-all text-[12px] font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-blue-500/20">
        Create First Project
      </button>
    </div>
  )
}

function ProjectCard({ project }: { project: any }) {
  const role = project.project_members?.[0]?.role || 'member'
  const isAdmin = role === 'admin'
  const date = project.created_at ? format(new Date(project.created_at), 'MMM dd') : 'N/A'

  const COLORS = [
    { bg: 'bg-blue-500/15', icon: 'text-blue-400' },
    { bg: 'bg-violet-500/15', icon: 'text-violet-400' },
    { bg: 'bg-emerald-500/15', icon: 'text-emerald-400' },
    { bg: 'bg-amber-500/15', icon: 'text-amber-400' },
    { bg: 'bg-rose-500/15', icon: 'text-rose-400' },
    { bg: 'bg-cyan-500/15', icon: 'text-cyan-400' },
  ]
  const color = COLORS[(project.id?.charCodeAt(0) || 0) % COLORS.length]

  return (
    <Link
      id="tour-project-card"
      href={`/projects/${project.id}`}
      className="group flex flex-col justify-between
                 h-[148px]
                 bg-slate-50/50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]
                 border border-gray-300 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-white/[0.12]
                 rounded-2xl p-4 transition-all duration-150 shadow-sm hover:shadow-md"
    >
      {/* TOP: icon + title + desc */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color.bg}`}>
          <FolderKanban size={18} className={color.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate leading-snug group-hover:text-[#0077B6] transition-colors">
            {project.name}
          </p>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-500 truncate leading-snug mt-0.5">
            {project.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* MIDDLE: pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[10px] font-semibold ${isAdmin ? 'bg-violet-500/10 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400' : 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
          }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {isAdmin ? 'Admin' : 'Member'}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400">
          <Layout size={9} /> Active
        </span>
        {isAdmin && (
          <span className="inline-flex items-center px-2.5 py-[3px] rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400">
            Owner
          </span>
        )}
      </div>

      {/* BOTTOM: divider + footer */}
      <div>
        <div className="h-px bg-slate-100 dark:bg-white/[0.07] mb-2.5" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10.5px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5"><Clock size={10} />{date}</span>
            <span className="flex items-center gap-1.5"><Layout size={10} />Active</span>
          </div>
          <ChevronRight size={13} className="text-slate-300 dark:text-slate-700 group-hover:text-[#0077B6] dark:group-hover:text-[#60a5fa] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}