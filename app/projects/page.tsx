'use client'

import { createClientSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, FolderKanban, Clock, Layout, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import CreateProjectModal from '@/components/projects/CreateProjectModal'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // Fetch projects from project_members join
    const { data } = await supabase
      .from('projects')
      .select(`
        *,
        project_members!inner(role)
      `)
      .eq('project_members.user_id', user.id)
      .order('created_at', { ascending: false })

    setProjects(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
      />

      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[32px] font-black text-gray-900 dark:text-slate-50 tracking-tightest leading-none mb-1.5 uppercase">Projects</h1>
          <p className="text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em] italic">Manage and track all collaborative projects.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2.5 bg-[#6366f1] text-white rounded-xl font-medium hover:bg-[#5558e3] transition-all flex items-center gap-2 shadow-lg shadow-[#6366f1]/20 self-start md:self-center active:scale-95"
        >
          <Plus size={18} /> New Project
        </button>
      </section>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects && projects.length > 0 ? (
          projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group bg-white dark:bg-slate-900/40 rounded-3xl border border-gray-100 dark:border-slate-800/50 shadow-sm hover:shadow-2xl hover:border-[#6366f1]/30 dark:hover:border-[#6366f1]/40 transition-all p-6 relative overflow-hidden flex flex-col h-full backdrop-blur-xl"
            >
              {/* Background Accent */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#6366f1]/5 rounded-full group-hover:scale-150 transition-transform duration-700" />

              <div className="relative z-10 flex grow flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center text-[#6366f1] group-hover:bg-[#6366f1] group-hover:text-white transition-colors duration-300">
                    <FolderKanban size={24} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${project.project_members?.[0]?.role === 'admin' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                    {project.project_members?.[0]?.role || 'Member'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2 truncate group-hover:text-[#6366f1] transition-colors">{project.name}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-500 line-clamp-2 mb-8 grow">{project.description || 'No description provided.'}</p>

                <div className="pt-6 border-t border-gray-50 dark:border-slate-800/50 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> {project.created_at ? format(new Date(project.created_at), 'MMM dd') : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layout size={14} /> Active
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#6366f1] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white dark:bg-slate-900/20 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm border-dashed">
            <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-gray-300 dark:text-slate-700 mb-6">
              <FolderKanban size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-50">No active projects</h3>
            <p className="text-gray-500 dark:text-slate-500 mt-2 max-w-xs text-center">Get started by executing your first project and deploying your squad.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-8 px-6 py-2.5 bg-gray-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-xl font-medium hover:scale-105 transition-all active:scale-95"
            >
              Deploy First Project
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

