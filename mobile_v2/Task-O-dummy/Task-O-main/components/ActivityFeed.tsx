'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import {
    CheckCircle2,
    Clock,
    User,
    Move,
    PlusCircle,
    Trash2,
    RefreshCw
} from 'lucide-react'

interface Activity {
    id: string
    type: string
    message: string
    created_at: string
    user_id: string
    task_id?: string
    metadata?: any
    user?: {
        full_name: string
        avatar_url?: string
    }
}

export default function ActivityFeed({ projectId, userTeamIds }: { projectId: string, userTeamIds?: string[] }) {
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)

    const fetchActivities = useCallback(async () => {
        // If userTeamIds is provided (admin case), filter activities by tasks belonging to those teams
        if (userTeamIds && userTeamIds.length > 0) {
            // First get task_ids that belong to the admin's teams
            const { data: teamTasks } = await supabase
                .from('tasks')
                .select('id')
                .eq('project_id', projectId)
                .in('team_id', userTeamIds)

            const taskIds = teamTasks?.map(t => t.id) || []

            // Fetch activities that are either general (no task_id) or related to those tasks
            const { data } = await supabase
                .from('activities')
                .select(`
                    *,
                    user:user_id (
                        full_name,
                        avatar_url
                    )
                `)
                .eq('project_id', projectId)
                .or(taskIds.length > 0 ? `task_id.in.(${taskIds.join(',')}),task_id.is.null` : 'task_id.is.null')
                .order('created_at', { ascending: false })
                .limit(50)

            if (data) setActivities(data as any)
        } else {
            // Owner sees everything
            const { data } = await supabase
                .from('activities')
                .select(`
                    *,
                    user:user_id (
                        full_name,
                        avatar_url
                    )
                `)
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(50)

            if (data) setActivities(data as any)
        }
        setLoading(false)
    }, [projectId, userTeamIds])

    useEffect(() => {
        fetchActivities()

        // Subscribe to new activities
        const channel = supabase
            .channel(`project_activities:${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'activities',
                    filter: `project_id=eq.${projectId}`
                },
                () => {
                    fetchActivities()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectId, fetchActivities])

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'task_created': return <PlusCircle size={16} className="text-green-500" />
            case 'status_change': return <RefreshCw size={16} className="text-blue-500" />
            case 'task_updated': return <RefreshCw size={16} className="text-indigo-500" />
            case 'task_deleted': return <Trash2 size={16} className="text-red-500" />
            default: return <Clock size={16} className="text-gray-400" />
        }
    }

    if (loading) return (
        <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366f1]"></div>
        </div>
    )

    if (activities.length === 0) return (
        <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-gray-300 dark:text-slate-800 mx-auto mb-4">
                <Clock size={32} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No activities recorded yet</p>
        </div>
    )

    return (
        <div className="space-y-6">
            {activities.map((activity, index) => (
                <div key={activity.id} className="relative pl-8 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                    {/* Timeline Line */}
                    {index !== activities.length - 1 && (
                        <div className="absolute left-[15px] top-6 bottom-[-24px] w-px bg-gray-100 dark:bg-slate-800" />
                    )}

                    {/* Icon */}
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-center z-10">
                        {getActivityIcon(activity.type)}
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-5 rounded-[28px] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-black text-gray-900 dark:text-slate-100 uppercase tracking-tighter">
                                        {activity.user?.full_name || 'System'}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        • {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-slate-400 leading-relaxed">
                                    {activity.message}
                                </p>
                            </div>
                            {activity.metadata?.to && (
                                <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                                    <span className="text-[8px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">
                                        {activity.metadata.to}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
