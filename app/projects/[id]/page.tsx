import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Activity, Zap, Users, Target, AlertCircle, Clock, Shield } from 'lucide-react'
import ProjectActions from '@/components/projects/ProjectActions'
import RecentActivity from '@/components/projects/RecentActivity'

export default async function ProjectOverviewPage({
  params
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

  // Fetch project stats
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('status, priority, due_date')
    .eq('project_id', id)

  const { data: teams } = await supabase
    .from('teams')
    .select('id')
    .eq('project_id', id)

  const { data: members } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', id)

  // Fetch team progress
  const { data: teamsWithProgress } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      tasks:tasks(id, status)
    `)
    .eq('project_id', id)

  // Fetch recent activities
  const { data: activities } = await supabase
    .from('activities')
    .select('*, user:user_id(full_name, avatar_url)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const teamsFormatted = teamsWithProgress?.map(team => {
    const teamTasks = team.tasks as any[]
    const teamTotal = teamTasks.length
    const teamCompleted = teamTasks.filter(t => t.status === 'completed').length
    const teamProgress = teamTotal > 0 ? Math.round((teamCompleted / teamTotal) * 100) : 0
    return { name: team.name, progress: teamProgress }
  }) || []

  const totalTasks = tasks?.length || 0
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
  const doingTasks = tasks?.filter(t => t.status === 'in_progress').length || 0
  const pendingTasks = tasks?.filter(t => t.status === 'pending' || t.status === 'review').length || 0

  const overdueTasks = tasks?.filter(t => {
    if (t.status === 'completed') return false
    if (!t.due_date) return false
    return new Date(t.due_date) < new Date()
  }).length || 0

  const healthScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const statusIndicator = healthScore > 60 ? 'On Track' : healthScore > 30 ? 'At Risk' : 'Off Track'

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32">
      {/* Header Summary */}
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] font-black text-gray-900 dark:text-slate-50 tracking-tightest leading-none mb-1.5 uppercase">Project Overview</h1>
        <p className="text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em] italic">Manage and track project performance.</p>
        <div className="h-px bg-gray-100 dark:bg-slate-800/50 w-full" />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-400 dark:text-slate-500">Project Integrity: </span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black uppercase tracking-widest ${healthScore > 60 ? 'text-emerald-500' : 'text-amber-500'}`}>{statusIndicator}</span>
              <div className="w-12 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${healthScore > 60 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase">{healthScore}%</span>
            </div>
          </div>
          <div>
            <span className="text-sm font-bold text-gray-400 dark:text-slate-500">Timeline: </span>
            <span className="text-sm font-black text-gray-900 dark:text-slate-50 uppercase tracking-widest">Execution Active</span>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl group hover:border-[#6366f1]/20 transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Total Tasks</p>
          <h3 className="text-[32px] font-black text-gray-900 dark:text-slate-50 tracking-tightest leading-none">{totalTasks}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl group hover:border-emerald-500/20 transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Resolved</p>
          <h3 className="text-[32px] font-black text-emerald-500 tracking-tightest leading-none">{completedTasks}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl group hover:border-amber-500/20 transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Operating</p>
          <h3 className="text-[32px] font-black text-amber-500 tracking-tightest leading-none">{doingTasks}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl group hover:border-indigo-500/20 transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Queued</p>
          <h3 className="text-[32px] font-black text-indigo-500 tracking-tightest leading-none">{pendingTasks}</h3>
        </div>
      </div>

      {/* Team Progress & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900/40 p-10 rounded-[50px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
          <h3 className="text-[12px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
            <Users size={14} className="text-[#6366f1]" /> Team Performance
          </h3>
          <div className="space-y-10">
            {teamsFormatted.length > 0 ? teamsFormatted.map((t: any) => (
              <div key={t.name} className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <span>{t.name}</span>
                  <span>{t.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#6366f1] to-purple-500 h-full transition-all duration-1000"
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                  <Users size={24} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Active Members</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 p-10 rounded-[50px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[12px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity size={14} className="text-[#6366f1]" /> Recent Activity
            </h3>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic">Live Feed</span>
          </div>
          <RecentActivity activities={activities || []} />
        </div>

        {/* Milestone Timeline (New Premium Widget) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900/40 p-10 rounded-[50px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
          <h3 className="text-[12px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
            <Clock size={14} className="text-[#6366f1]" /> Project Timeline
          </h3>
          <div className="space-y-8 relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-100 dark:bg-slate-800" />
            {[
              { label: 'Venue Security Sweep', status: 'completed', date: 'Feb 15' },
              { label: 'Logistics Deployment', status: 'active', date: 'Feb 20' },
              { label: 'Media Briefing', status: 'pending', date: 'Mar 01' },
              { label: 'Main Event Execution', status: 'pending', date: 'Mar 12' }
            ].map((m, i) => (
              <div key={i} className="flex gap-4 relative z-10">
                <div className={`w-4 h-4 rounded-full border-4 border-white dark:border-slate-950 ${m.status === 'completed' ? 'bg-emerald-500' : m.status === 'active' ? 'bg-[#6366f1] animate-pulse' : 'bg-gray-200'}`} />
                <div className="flex-1 -mt-1">
                  <p className="text-[11px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-tight">{m.label}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.date} - {m.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Sector Status & Budget (National Convention Specific) */}
      {project.name.toLowerCase().includes('convention') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-5 duration-700">
          <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[50px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
            <h3 className="text-[12px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Shield size={14} className="text-[#6366f1]" /> Sector Readiness status
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Logan Sector', progress: 85, status: 'Secured' },
                { label: 'Hub Sector', progress: 42, status: 'Infiltrated' },
                { label: 'Delta Zone', progress: 100, status: 'Resolved' },
                { label: 'Perimeter', progress: 68, status: 'Active' }
              ].map((sector, i) => (
                <div key={i} className="p-6 rounded-3xl bg-gray-50/50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800/50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#6366f1]">{sector.label}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${sector.status === 'Resolved' ? 'text-emerald-500' : sector.status === 'Infiltrated' ? 'text-amber-500' : 'text-indigo-500'}`}>{sector.status}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${sector.status === 'Resolved' ? 'bg-emerald-500' : 'bg-[#6366f1]'}`}
                      style={{ width: `${sector.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0f172a] p-12 rounded-[50px] shadow-2xl shadow-slate-950/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <h3 className="text-[12px] font-black text-white/40 uppercase tracking-[0.2em] mb-10 relative z-10">Strategic Budget Allocation</h3>
            <div className="space-y-8 relative z-10">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Total Mission Fund</p>
                  <h4 className="text-[32px] font-black tracking-tightest leading-none text-indigo-400">$1.2M</h4>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Deployed</p>
                  <h4 className="text-[20px] font-black tracking-tightest leading-none text-white">$842K</h4>
                </div>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[70%]" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Personnel</p>
                  <p className="text-[12px] font-bold">$420,000</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Logistics</p>
                  <p className="text-[12px] font-bold">$380,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#6366f1] p-12 rounded-[50px] shadow-xl shadow-indigo-600/20 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-[12px] font-black text-white/60 uppercase tracking-[0.2em] mb-6">Project Progress</h3>
            <p className="text-[20px] font-black uppercase tracking-tightest leading-tight">
              Progress is <span className="text-white/40">{healthScore}%</span> relative to targets.
              {overdueTasks > 0 ? ` Immediate intervention required for ${overdueTasks} overdue tasks.` : ' Deployment status remains optimal.'}
            </p>
          </div>
          <div className="mt-8 flex items-center gap-4 border-t border-white/10 pt-8">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-black">U</div>
              ))}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Active Members</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm">
          <h3 className="text-[12px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-[0.2em] mb-8 text-center flex items-center justify-center gap-2">
            <Zap size={14} className="text-amber-500" /> Operational Control
          </h3>
          <ProjectActions
            projectId={id}
            isAdmin={project.owner_id === user.id}
          />
        </div>
      </div>
    </div>
  )
}
