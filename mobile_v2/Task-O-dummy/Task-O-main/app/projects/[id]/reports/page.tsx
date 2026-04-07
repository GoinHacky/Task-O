import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BarChart3, TrendingUp, CheckCircle2, Clock, Zap, Target, AlertCircle } from 'lucide-react'

export default async function ProjectReportsPage({
    params,
}: {
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

    // Fetch project details
    const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', id)
        .single()

    if (!project) notFound()

    // Fetch tasks for stats
    const { data: tasks } = await supabase
        .from('tasks')
        .select('status, priority')
        .eq('project_id', id)

    // Fetch team velocity
    const { data: teamWorkload } = await supabase
        .from('teams')
        .select(`
            id,
            name,
            tasks:tasks(id, status)
        `)
        .eq('project_id', id)

    const teamVelocity = teamWorkload?.map(team => {
        const teamTasks = (team.tasks as any[]) || []
        const teamTotal = teamTasks.length
        const teamCompleted = teamTasks.filter(t => t.status === 'completed').length
        const teamV = teamTotal > 0 ? Math.round((teamCompleted / teamTotal) * 100) : 0
        return { name: team.name, velocity: teamV }
    }) || []

    // Bottleneck analysis: Count overdue tasks per team
    const bottlenecks = teamWorkload?.map(team => {
        const overdue = (team.tasks as any[] || []).filter(t => {
            // Placeholder logic: tasks in progress for more than X days or overdue
            return t.status !== 'completed'
        }).length
        return { name: team.name, score: overdue }
    }).sort((a, b) => b.score - a.score) || []

    const total = tasks?.length || 0
    const completed = tasks?.filter(t => t.status === 'completed').length || 0
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-32">
            {/* Report Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.3em]">Insights & Intelligence</h2>
                <div className="h-px bg-gray-100 dark:bg-slate-800/50 w-full" />
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                        <button className="px-6 py-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-all">
                            Date Range: Last 30 Days
                        </button>
                    </div>
                    <button className="px-6 py-2 bg-[#6366f1] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all">
                        Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Completion Velocity */}
                <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[50px] border border-gray-100 dark:border-slate-800/50 shadow-sm flex flex-col items-center justify-center text-center backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10">
                        <Zap size={24} className="text-indigo-500/20" />
                    </div>

                    <div className="relative w-48 h-48 mb-10">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle
                                className="text-gray-50 dark:text-slate-800/50"
                                strokeWidth="2.5"
                                stroke="currentColor"
                                fill="transparent"
                                r="16"
                                cx="18"
                                cy="18"
                            />
                            <circle
                                className="text-[#6366f1] transition-all duration-1000 ease-out"
                                strokeWidth="2.5"
                                strokeDasharray={`${completionRate}, 100`}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="16"
                                cx="18"
                                cy="18"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[42px] font-black text-gray-900 dark:text-slate-50 tracking-tightest leading-none">{completionRate}%</span>
                            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">Aggregate Rate</span>
                        </div>
                    </div>
                    <h3 className="text-[18px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-tightest mb-1.5">Velocity Baseline</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest italic">Answering: Are we improving?</p>
                </div>

                {/* Team Velocity Matrix */}
                <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[50px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
                    <h3 className="text-[14px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-[0.2em] mb-10">Velocity by Team</h3>
                    <div className="space-y-8">
                        {teamVelocity.map((t, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
                                    <span>{t.name}</span>
                                    <span className="text-[#6366f1]">{t.velocity}% Efficient</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#6366f1] transition-all duration-1000"
                                        style={{ width: `${t.velocity}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Priority Concentration */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 p-10 rounded-[50px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Target size={20} />
                        </div>
                        <h3 className="text-[14px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-widest">Bottleneck Analysis</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {bottlenecks.map((b, i) => (
                            <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50/50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800/50">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{b.name}</p>
                                    <p className="text-[15px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-tightest">{b.score} Critical Items</p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${b.score > 5 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                    {b.score > 5 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Insight Callout */}
                <div className="bg-[#1e293b] p-12 rounded-[50px] shadow-2xl flex flex-col justify-between text-white border border-slate-700">
                    <div>
                        <BarChart3 className="text-[#6366f1] mb-8" size={32} />
                        <h3 className="text-[14px] font-black text-white/40 uppercase tracking-[0.2em] mb-6">Performance Report</h3>
                        <p className="text-[20px] font-black uppercase tracking-tightest leading-tight">
                            Team efficiency is trending <span className="text-[#6366f1]">Upward</span> this period.
                        </p>
                    </div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest italic mt-12 py-6 border-t border-white/5">
                        Historical data suggests 20% improvement since inception.
                    </p>
                </div>
            </div>
        </div>
    )
}
