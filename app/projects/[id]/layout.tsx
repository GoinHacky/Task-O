import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import ProjectNav from '@/components/projects/ProjectNav'
import ProjectHeader from '@/components/projects/ProjectHeader'

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
            <div className="mb-10">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                        <Link href="/dashboard" className="hover:text-[#6366f1] transition-all">Dashboard</Link>
                        <ChevronRight size={10} className="text-gray-300 dark:text-slate-700" />
                        <Link href="/projects" className="hover:text-[#6366f1] transition-all">Projects</Link>
                        <ChevronRight size={10} className="text-gray-300 dark:text-slate-700" />
                        <span className="text-gray-900 dark:text-slate-100 italic">{project.name}</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <ProjectHeader projectName={project.name} projectDescription={project.description} />

                        <ProjectNav projectId={id} role={userRole} />
                    </div>
                </div>
            </div>

            <div className="flex-1">
                {children}
            </div>
        </div>
    )
}
