import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Users, Layout, ChevronRight, TrendingUp, Shield, Activity, User } from 'lucide-react'
import KanbanBoard from '@/components/KanbanBoard'
import Link from 'next/link'
import TeamPersonnelClient from './TeamPersonnelClient'

export default async function TeamDashboardPage({
    params,
}: {
    params: { id: string; teamId: string }
}) {
    const { id: projectId, teamId } = params
    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: team, error: teamError } = await supabase
        .from('teams')
        .select(`
          *,
          members:team_members(
            id,
            role,
            user:user_id(id, full_name, avatar_url, email)
          )
        `)
        .eq('id', teamId)
        .single()

    if (teamError || !team) {
        notFound()
    }

    const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', team.project_id)
        .single()

    const { data: tasks } = await supabase
        .from('tasks')
        .select(`
            *,
            assignee:assigned_to (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

    const { data: callerMembership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single()

    const isAdmin = ['owner', 'admin'].includes(callerMembership?.role || '')

    // Filter team lead
    const teamLead = team.members.find((m: any) => m.role === 'admin' || m.role === 'owner')?.user

    const stats = {
        total: tasks?.length || 0,
        completed: tasks?.filter(t => t.status === 'completed').length || 0,
        ongoing: tasks?.filter(t => t.status === 'in_progress' || t.status === 'review').length || 0,
        overdue: tasks?.filter(t => {
            if (t.status === 'completed') return false
            if (!t.due_date) return false
            return new Date(t.due_date) < new Date()
        }).length || 0,
        progress: (tasks?.length || 0) > 0 ? (tasks?.filter(t => t.status === 'completed').length || 0) / (tasks?.length || 1) * 100 : 0
    }

    const recentTasks = tasks?.slice(0, 5) || []

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl text-[#6366f1] border border-indigo-100 dark:border-indigo-500/20 shadow-sm transition-transform hover:scale-105">
                            <Users size={32} />
                        </div>
                        <div>
                            <h1 className="text-[36px] font-black text-gray-900 dark:text-slate-50 tracking-tightest leading-none uppercase">{team.name}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Shield size={10} className="text-indigo-500" /> Lead: <span className="text-gray-900 dark:text-slate-300">{teamLead?.full_name || 'Unassigned'}</span>
                                </p>
                                <div className="w-1 h-1 rounded-full bg-gray-200" />
                                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                    {team.members.length} Personnel Units
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="text-[14px] text-gray-500 dark:text-slate-400 leading-relaxed font-bold uppercase tracking-tightest opacity-60">
                        {team.description || 'Specialized operational segment for workspace objectives.'}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Workspace Velocity</span>
                        <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${stats.progress > 60 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {stats.progress > 60 ? 'Stable' : 'Observation Req'}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                            <p className="text-[20px] font-black text-emerald-500 leading-none">{stats.completed}</p>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-tightest mt-2">Done</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[20px] font-black text-amber-500 leading-none">{stats.ongoing}</p>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-tightest mt-2">Active</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[20px] font-black text-rose-500 leading-none">{stats.overdue}</p>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-tightest mt-2">Risks</p>
                        </div>
                    </div>
                    <div className="mt-8 h-1.5 w-full bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden border border-gray-100 dark:border-slate-800/50">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                            style={{ width: `${stats.progress}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <section className="lg:col-span-2 space-y-10">
                    {/* Recent Tasks Manifest */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2 text-indigo-500/50">
                            <div className="flex items-center gap-2">
                                <Activity size={14} />
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#6366f1]">Recent Tasks Manifest</h3>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-tighter italic">Execution Registry</span>
                        </div>
                        <div className="space-y-3">
                            {recentTasks.length > 0 ? recentTasks.map((t: any) => (
                                <div key={t.id} className="p-5 bg-white dark:bg-slate-900/40 rounded-[32px] border border-gray-100 dark:border-slate-800/50 flex items-center justify-between group hover:border-indigo-500/30 transition-all shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black shadow-inner ${t.status === 'completed' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100/50' :
                                            t.status === 'review' ? 'bg-indigo-50 text-indigo-500 border border-indigo-100/50' : 'bg-amber-50 text-amber-500 border border-amber-100/50'
                                            }`}>
                                            {t.status[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-tightest group-hover:text-indigo-500 transition-colors leading-none">{t.title}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1.5 opacity-60 flex items-center gap-1.5">
                                                <User size={8} /> Assigned to {t.assignee?.full_name || 'Personnel'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
                                </div>
                            )) : (
                                <div className="p-10 text-center border border-dashed border-gray-100 dark:border-slate-800 rounded-[32px]">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Recent Operations Detected</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 dark:border-slate-800/50">
                        <Link
                            href={`/projects/${projectId}/kanban`}
                            className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-indigo-100 dark:border-indigo-500/20 shadow-sm"
                        >
                            Access Full Operational Board <ChevronRight size={14} />
                        </Link>
                    </div>
                </section>

                <TeamPersonnelClient team={team} projectId={projectId} isAdmin={isAdmin} tasks={tasks || []} />
            </div>
        </div>
    )
}
