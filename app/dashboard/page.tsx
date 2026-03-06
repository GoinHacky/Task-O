import { createServerSupabaseClient } from '@/lib/supabase/server'
import Image from 'next/image'
import {
  Users,
  Bell,
  BadgeCheck,
  UserRoundCheck,
  LayoutDashboard,
  CalendarCheck2
} from 'lucide-react'
import { format } from 'date-fns'
import { DashboardActions, SectionDropdown, TeamActions, TaskPriorityList } from '@/components/dashboard/DashboardClient'
import ScrollSuggestion from '@/components/ScrollSuggestion'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      projects:project_id (
        id,
        name
      )
    `)
    .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)

  const { data: teams } = await supabase
    .from('team_members')
    .select(`
        role,
        teams (
            id,
            name,
            avatar_url,
            team_members(count)
        )
    `)
    .eq('user_id', user.id)
    .limit(5)

  const { data: announcements } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const completedCount = tasks?.filter(t => t.status === 'completed').length || 0
  const assignedCount = tasks?.filter(t => t.assigned_to === user.id && t.status !== 'completed').length || 0
  const scheduledCount = tasks?.filter(t => t.due_date && new Date(t.due_date) > new Date() && t.status !== 'completed').length || 0

  const formatCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const upcomingTasks = tasks
    ?.filter(t => t.status !== 'completed' && t.due_date)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 4)

  return (
    <div className="space-y-6 md:space-y-8 lg:space-y-10 animate-in fade-in duration-700 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Stats Cards Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {[
          {
            label: 'Completed Tasks',
            value: formatCount(completedCount),
            icon: BadgeCheck,
            bg: '#0093c4',
            iconColor: '#0093c4',
            strokeWidth: 2,
          },
          {
            label: 'Assigned Tasks',
            value: formatCount(assignedCount),
            icon: UserRoundCheck,
            bg: '#0072b0',
            iconColor: '#0072b0',
            strokeWidth: 2,
          },
          {
            label: 'Active Boards',
            value: formatCount(projectCount || 0),
            icon: LayoutDashboard,
            bg: '#00509d',
            iconColor: '#00509d',
            strokeWidth: 2,
          },
          {
            label: 'Scheduled Tasks',
            value: formatCount(scheduledCount),
            icon: CalendarCheck2,
            bg: '#00296b',
            iconColor: '#00296b',
            strokeWidth: 2,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-[20px] lg:rounded-[24px] shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col p-4 lg:p-5 gap-4 lg:gap-5"
            style={{
              backgroundColor: stat.bg,
            }}
          >
            <div className="flex items-center gap-4 lg:gap-5">
              {/* White Icon Box */}
              <div
                className="w-[52px] h-[52px] lg:w-[64px] lg:h-[64px] bg-white rounded-[14px] lg:rounded-[18px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm"
                style={{ color: stat.iconColor }}
              >
                <stat.icon size={26} strokeWidth={stat.strokeWidth} className="lg:w-[30px] lg:h-[30px]" />
              </div>
              {/* Large White Number */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[40px] lg:text-[48px] font-normal text-white leading-none">
                  {stat.value}
                </h3>
              </div>
            </div>
            {/* White Label Bar */}
            <div className="bg-white w-full rounded-[10px] lg:rounded-[12px] py-3 lg:py-3.5 px-3 flex justify-center items-center">
              <p
                className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.15em] leading-tight text-center"
                style={{ color: stat.bg }}
              >
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
        {/* Task Priorities List */}
        <section className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] border border-gray-400/40 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col p-8 lg:p-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl lg:text-[28px] font-semibold text-gray-900 dark:text-slate-50 tracking-tight leading-none">Objective Priorities</h2>
              <p className="mt-1 text-[11px] lg:text-[13px] text-gray-400 dark:text-slate-500">Collective objectives sorted by priority</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <DashboardActions />
              <SectionDropdown />
            </div>
          </div>

          <TaskPriorityList
            tasks={tasks || []}
            completedCount={completedCount}
            pendingCount={tasks?.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) >= new Date()).length || 0}
            overdueCount={tasks?.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length || 0}
          />
        </section>

        {/* Announcements / Updates */}
        <section className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-400/40 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[22px] font-semibold text-gray-900 dark:text-slate-50 tracking-tight">Announcements</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 font-bold italic">System briefs and project updates</p>
            </div>
            <SectionDropdown />
          </div>

          <div className="p-4 sm:p-6 lg:p-8 pt-4 sm:pt-5 lg:pt-6 space-y-6 sm:space-y-8 lg:space-y-10 relative flex-1">
            <div className="absolute left-[31px] sm:left-[39px] lg:left-[47px] top-10 bottom-10 w-[2px] bg-[#f3f4ff] dark:bg-slate-800/50" />
            {announcements && announcements.length > 0 ? announcements.map((ann, i) => (
              <div key={ann.id} className="relative flex gap-3 sm:gap-4 lg:gap-5 z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-[#f3f4ff] dark:bg-indigo-500/10 border-2 sm:border-4 border-white dark:border-slate-950 flex items-center justify-center text-[#6366f1] shrink-0 shadow-sm">
                  {ann.type === 'team_invitation' ? <Users size={14} className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px]" /> : <Bell size={14} className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px]" />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-[14px] lg:text-[15px] font-bold text-gray-900 dark:text-white leading-tight break-words">{ann.message}</h4>
                  <p className="mt-1 sm:mt-1.5 lg:mt-2 text-[10px] sm:text-[11px] lg:text-[12px] font-semibold text-gray-400 dark:text-gray-500">{format(new Date(ann.created_at), 'dd MMM yyyy - p')}</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 sm:py-16 lg:py-20">
                <Bell size={30} className="sm:w-[35px] sm:h-[35px] lg:w-10 lg:h-10 text-gray-100 dark:text-slate-800 mb-3 sm:mb-4" />
                <p className="text-sm sm:text-[14px] lg:text-base text-gray-300 dark:text-slate-600 font-medium px-4">System updates will appear here</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* My Teams Section */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-gray-400/40 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-[26px] font-semibold text-gray-900 dark:text-slate-50 tracking-tight">Teams</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500">Teams with active tasks</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <TeamActions />
            <SectionDropdown />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
          {teams && teams.length > 0 ? teams.filter((m: any) => m.teams).map((membership: any) => {
            const team = membership.teams
            return (
              <div key={team.id} className="p-6 sm:p-8 lg:p-10 bg-white dark:bg-slate-900 border border-gray-400/40 dark:border-slate-800 rounded-2xl sm:rounded-3xl lg:rounded-[32px] hover:border-[#6366f1] hover:shadow-xl hover:shadow-[#6366f1]/5 transition-all duration-500 group flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 text-gray-200 dark:text-slate-800 group-hover:text-gray-400 dark:group-hover:text-gray-600 transition-colors">
                  <SectionDropdown />
                </div>
                <div className="w-20 h-20 rounded-[28px] bg-gray-50 dark:bg-slate-800/50 mb-6 flex items-center justify-center text-[#6366f1] text-2xl font-black group-hover:scale-110 transition-transform duration-500 shadow-sm border border-gray-400/40 dark:border-slate-800">
                  {team.avatar_url ? (
                    <Image
                      src={team.avatar_url}
                      alt={team.name}
                      width={80}
                      height={80}
                      className="w-full h-full rounded-[28px] object-cover"
                    />
                  ) : team.name[0]}
                </div>
                <h4 className="text-sm sm:text-[15px] md:text-base lg:text-[17px] font-bold text-gray-900 dark:text-slate-100 truncate w-full group-hover:text-[#6366f1] transition-colors px-2">{team.name}</h4>
                <div className="mt-1 sm:mt-1.5 lg:mt-2 flex flex-col gap-0.5 sm:gap-1">
                  <p className="text-xs sm:text-sm lg:text-sm font-semibold text-gray-400 dark:text-gray-500">{team.team_members?.[0]?.count || 0} Members</p>
                  <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-[#6366f1] bg-[#f3f4ff] dark:bg-indigo-500/10 px-1.5 sm:px-2 py-0.5 rounded-full inline-block mx-auto">
                    {membership.role}
                  </span>
                </div>
              </div>
            )
          }) : (
            <div className="col-span-full py-12 sm:py-16 lg:py-20 text-center bg-[#fcfcfd] rounded-2xl sm:rounded-3xl lg:rounded-[32px] border border-dashed border-gray-200 px-4">
              <Users size={32} className="sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-200 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-400 font-bold">You aren&apos;t a member of any teams yet.</p>
            </div>
          )}
        </div>
      </section>

      <ScrollSuggestion />
    </div>
  )
}