import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Bell, Check, Trash2, Users } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import NotificationActions from '@/components/notifications/NotificationActions'
import InvitationActions from '@/components/notifications/InvitationActions'

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const unreadCount = notifications?.filter((n) => !n.read).length || 0

  return (
    <div className="flex justify-center pt-10">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900/40 rounded-[48px] border border-gray-100 dark:border-slate-800/50 shadow-2xl shadow-indigo-100/10 dark:shadow-none backdrop-blur-xl overflow-hidden p-10 md:p-14 animate-in fade-in zoom-in duration-700">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 dark:text-slate-50 tracking-tightest mb-4 flex items-center gap-4">
            Notifications
            {unreadCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-sm font-medium text-gray-400 dark:text-slate-500 italic max-w-sm leading-relaxed">
            Stay updated with your team activity and project milestones.
          </p>
        </div>

        <div className="space-y-8">
          {notifications && notifications.length > 0 ? (
            <ul className="space-y-6">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className="flex items-start gap-6 group p-6 rounded-[32px] hover:bg-gray-50/50 dark:hover:bg-slate-800/20 border border-transparent hover:border-gray-100 dark:hover:border-slate-800/50 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${!notification.read
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-[#6366f1] shadow-lg shadow-indigo-100/50 dark:shadow-none scale-105'
                    : 'bg-gray-50 dark:bg-slate-900 border-gray-50 dark:border-slate-800 text-gray-400'
                    }`}>
                    {notification.type === 'team_invitation' || notification.type === 'project_invite' ? <Users size={20} /> : <Bell size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <p className={`text-[15px] font-black tracking-tight ${!notification.read ? 'text-gray-900 dark:text-slate-50' : 'text-gray-500 dark:text-slate-400'}`}>
                        {notification.type === 'team_invitation' ? 'Team Invitation' :
                          notification.type === 'project_invite' ? 'Project Access' :
                            'Update Alert'}
                      </p>
                      <span className="text-[10px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-widest whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${!notification.read ? 'text-gray-600 dark:text-slate-300' : 'text-gray-400 dark:text-slate-500 italic'}`}>
                      {notification.message}
                    </p>
                    {notification.type === 'project_invite' && notification.related_id && !notification.read && (
                      <InvitationActions projectId={notification.related_id} />
                    )}
                    {notification.related_id && (
                      <Link
                        href={notification.type === 'team_invitation' ? '/teams' :
                          notification.type === 'project_invite' ? `/projects/${notification.related_id}` :
                            `/tasks/${notification.related_id}`}
                        className="mt-4 text-[11px] font-black text-[#6366f1] hover:text-[#5558e3] uppercase tracking-[0.1em] flex items-center gap-1.5 transition-all group-hover:gap-2"
                      >
                        {notification.type === 'team_invitation' ? 'View Team' :
                          notification.type === 'project_invite' ? 'Enter Project' :
                            'Go to Task'}
                        <span className="text-lg leading-none">&rarr;</span>
                      </Link>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <NotificationActions
                      notificationId={notification.id}
                      isRead={notification.read}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium italic">No notifications found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }) {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}hrs ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  return format(date, 'dd MMM')
}

