import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import ProjectNav from '@/components/projects/ProjectNav'
import ProjectHeader from '@/components/projects/ProjectHeader'
import PresenceBar from '@/components/PresenceBar'

export default async function ProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: { id: string }
}) {
    const { id } = params
    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Fetch project directly. RLS will ensure it's null if no access.
    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (!project) {
        notFound()
    }

    // 2. Fetch role for navigation permissions
    const { data: membership } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .single()

    const userRole = membership?.role || (project.owner_id === user.id ? 'owner' : 'member')

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/60 shadow-sm dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[32px] md:rounded-[48px] p-6 sm:p-8 md:p-10 lg:p-14 mb-10 overflow-hidden relative">
                {/* Optional glass effect background */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-3 md:gap-4">
                    <div className="flex flex-col gap-2 md:gap-3">
                        <div className="flex items-center flex-wrap gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] text-gray-400 dark:text-slate-500">
                            <Link href="/dashboard" className="hover:text-[#6366f1] transition-all">Dashboard</Link>
                            <span className="text-gray-300 dark:text-slate-700 mx-1">›</span>
                            <Link href="/projects" className="hover:text-[#6366f1] transition-all">Projects</Link>
                            <span className="text-gray-300 dark:text-slate-700 mx-1">›</span>
                            <span className="text-gray-900 dark:text-slate-100">{project.name}</span>
                        </div>
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
                            <ProjectHeader projectName={project.name} projectDescription={project.description} />

                            <div className="flex flex-col items-end gap-4">
                                <PresenceBar projectId={id} currentUser={user} />
                                <ProjectNav projectId={id} role={userRole} />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
