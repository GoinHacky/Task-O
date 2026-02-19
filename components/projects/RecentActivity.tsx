'use client'

import { format } from 'date-fns'
import {
    CheckCircle2, PlusCircle, UserPlus, Users,
    ArrowRightCircle, MessageSquare, Shield, Clock
} from 'lucide-react'

const ACTIVITY_ICONS: Record<string, any> = {
    task_completed: CheckCircle2,
    task_created: PlusCircle,
    task_updated: Clock,
    member_joined: UserPlus,
    member_invited: Users,
    team_created: Users,
    status_change: ArrowRightCircle,
    comment_added: MessageSquare
}

const ACTIVITY_COLORS: Record<string, string> = {
    task_completed: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
    task_created: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10',
    task_updated: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
    member_joined: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
    member_invited: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10',
    team_created: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10',
    status_change: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10',
    comment_added: 'text-slate-500 bg-slate-50 dark:bg-slate-500/10'
}

export default function RecentActivity({ activities }: { activities: any[] }) {
    if (!activities || activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                <Clock size={32} className="text-gray-300 mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Recent Activity Detected</p>
            </div>
        )
    }

    return (
        <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-100 dark:bg-slate-800" />

            <div className="space-y-8">
                {activities.map((activity) => {
                    const Icon = ACTIVITY_ICONS[activity.type] || Shield
                    const colorClass = ACTIVITY_COLORS[activity.type] || 'text-gray-400 bg-gray-50'

                    return (
                        <div key={activity.id} className="relative pl-10 group">
                            {/* Icon Node */}
                            <div className={`absolute left-0 top-0 w-8 h-8 rounded-xl flex items-center justify-center border border-white dark:border-slate-900 shadow-sm z-10 ${colorClass} transition-transform group-hover:scale-110`}>
                                <Icon size={14} />
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight leading-none">
                                        {activity.user?.full_name || 'System Operator'}
                                    </p>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                                        {format(new Date(activity.created_at), 'HH:mm • MMM dd')}
                                    </span>
                                </div>
                                <p className="text-[12px] font-bold text-gray-600 dark:text-slate-400 leading-tight">
                                    {activity.message}
                                </p>
                                {activity.metadata?.to && (
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 dark:bg-slate-800/50 rounded-md border border-gray-100 dark:border-slate-800 shadow-inner">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tightest">New Status:</span>
                                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{activity.metadata.to}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
