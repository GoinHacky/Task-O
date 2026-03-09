'use client'

import { useState } from 'react'
import {
    Bell, AtSign, Briefcase, UserPlus, Info,
    Search, Filter, CheckCircle2, MoreVertical,
    Check, Play, Reply, RotateCcw, Settings, ChevronDown,
    Eye, Clock
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { updateTask } from '@/lib/tasks/actions'

interface Notification {
    id: string
    type: 'mention' | 'assignment' | 'invite' | 'alert' | 'workspace_invite' | 'task_assignment' | 'project_invite' | 'review_required' | 'task_status_change'
    message: string
    read: boolean
    created_at: string
    related_id?: string
    metadata?: {
        project_name?: string
        due_date?: string
        sender_name?: string
    }
}

interface InboxAlertsProps {
    notifications: Notification[]
}

export default function InboxAlerts({ notifications: initialNotifications }: InboxAlertsProps) {
    const [notifications, setNotifications] = useState(initialNotifications)
    const [filter, setFilter] = useState<'all' | 'assigned' | 'mention' | 'review' | 'system' | 'invite'>('all')
    const [unreadOnly, setUnreadOnly] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const router = useRouter()

    const handleAction = async (notifId: string, action: string, taskId?: string) => {
        if (!taskId) return
        setProcessingId(notifId)
        try {
            switch (action) {
                case 'start':
                    await updateTask(taskId, { status: 'in_progress' })
                    break
                case 'approve':
                    await updateTask(taskId, { status: 'completed' })
                    break
                case 'reopen':
                    await updateTask(taskId, { status: 'todo' })
                    break
                case 'accept':
                case 'reject':
                    const { respondToPlatformInvitation } = await import('@/lib/users/actions')
                    await respondToPlatformInvitation(taskId, action === 'accept')
                    break
                default:
                    break
            }
            // Mark as read after action
            await supabase.from('notifications').update({ read: true }).eq('id', notifId)
            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
            router.refresh()
        } catch (error) {
            console.error(`Failed to perform action ${action}:`, error)
        } finally {
            setProcessingId(null)
        }
    }

    const filteredNotifications = notifications.filter(n => {
        if (unreadOnly && n.read) return false
        if (filter === 'all') return true
        if (filter === 'assigned') return n.type === 'assignment' || n.type === 'task_assignment'
        if (filter === 'mention') return n.type === 'mention'
        if (filter === 'review') return n.type === 'review_required' || (n.type === 'task_status_change' && n.message.toLowerCase().includes('review'))
        if (filter === 'invite') return n.type === 'invite' || n.type === 'workspace_invite' || n.type === 'project_invite'
        if (filter === 'system') return n.type === 'alert' || (n.type === 'task_status_change' && !n.message.toLowerCase().includes('review'))
        return true
    })

    const getTypeConfig = (type: string, message: string = '') => {
        if (type === 'task_status_change' && message.toLowerCase().includes('review')) {
            return { label: 'Review Required', color: 'text-blue-500', dot: '🔵' }
        }

        switch (type) {
            case 'assignment':
            case 'task_assignment':
                return { label: 'Assigned', color: 'text-blue-500', dot: '🔵' }
            case 'mention':
                return { label: 'Mention', color: 'text-amber-400', dot: '🟡' }
            case 'review_required':
                return { label: 'Review Required', color: 'text-blue-500', dot: '🔵' }
            case 'invite':
            case 'workspace_invite':
            case 'project_invite':
                return { label: 'Invitation', color: 'text-purple-500', dot: '⚪' }
            default:
                return { label: 'System', color: 'text-gray-400', dot: '⚙' }
        }
    }

    return (
        <div className="flex flex-col max-w-4xl mx-auto bg-white dark:bg-slate-950/40 rounded-[32px] md:rounded-[48px] border border-gray-300 dark:border-slate-800/50 shadow-2xl shadow-indigo-100/10 dark:shadow-none backdrop-blur-xl overflow-hidden min-h-[calc(100vh-120px)] animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="p-6 md:p-10 pb-4 md:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-slate-50 tracking-tightest">INBOX</h1>

                    <div className="relative">
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className="flex items-center gap-2 px-6 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-500 transition-all"
                        >
                            Filter: {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)} <ChevronDown size={14} />
                        </button>

                        {showFilterDropdown && (
                            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                                {(['all', 'assigned', 'mention', 'review', 'invite', 'system'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => { setFilter(f); setShowFilterDropdown(false); }}
                                        className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 transition-all ${filter === f ? 'text-indigo-500' : 'text-gray-400'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                    {(['assigned', 'mention', 'review', 'invite', 'system'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(filter === t ? 'all' : t)}
                            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${filter === t
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-gray-50 dark:bg-slate-800/50 text-gray-400 border border-gray-300 dark:border-slate-700/50 hover:text-gray-600 dark:hover:text-slate-300'}`}
                        >
                            {t === 'review' ? 'Approvals' : t === 'invite' ? 'Invites' : t + 's'}
                        </button>
                    ))}

                    <div className="flex items-center gap-3 sm:ml-auto px-4 py-2 bg-gray-50/50 dark:bg-slate-900/50 rounded-2xl border border-gray-300 dark:border-slate-800/50 w-fit">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unread Only</span>
                        <button
                            onClick={() => setUnreadOnly(!unreadOnly)}
                            className={`w-10 h-5 rounded-full transition-all relative ${unreadOnly ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-slate-800'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${unreadOnly ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-slate-800" />
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto px-4 md:px-10 pb-10 md:pb-20 space-y-0 custom-scrollbar">
                {filteredNotifications.length > 0 ? filteredNotifications.map((notif, index) => {
                    const config = getTypeConfig(notif.type, notif.message)
                    const isTask = notif.type === 'assignment' || notif.type === 'task_assignment'
                    const isMention = notif.type === 'mention'
                    const isReview = notif.type === 'review_required' || (notif.type === 'task_status_change' && notif.message.toLowerCase().includes('review'))

                    return (
                        <div key={notif.id} className="relative">
                            <div className={`group py-6 md:py-10 px-0 sm:px-4 md:px-8 transition-all duration-500 ${!notif.read ? 'bg-transparent' : 'opacity-60'}`}>
                                <div className="flex items-start gap-3 md:gap-4 mb-4">
                                    <span className="text-lg mt-0.5 leading-none shrink-0">{config.dot}</span>
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-1">
                                            <h3 className={`text-base md:text-lg font-black tracking-tight leading-tight ${!notif.read ? 'text-gray-900 dark:text-slate-50' : 'text-gray-500 dark:text-slate-400'}`}>
                                                {notif.message}
                                            </h3>
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest whitespace-nowrap pt-1">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                Project: <span className="text-indigo-500/80">{notif.metadata?.project_name || 'General'}</span>
                                            </p>
                                            {isTask && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                                                    <Clock size={10} className="text-red-500" />
                                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                                                        Due {notif.metadata?.due_date || 'Tomorrow'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Row */}
                                {!notif.read && (
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 pl-7 md:pl-9 mt-6 md:mt-8">
                                        {isTask && (
                                            <button
                                                disabled={!!processingId}
                                                onClick={() => handleAction(notif.id, 'start', notif.related_id)}
                                                className="flex-1 sm:flex-none px-4 md:px-8 py-2 md:py-2.5 bg-[#6366f1] text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-[#5558e3] transition-all shadow-lg shadow-[#6366f1]/20 active:scale-95 disabled:opacity-50"
                                            >
                                                Start
                                            </button>
                                        )}
                                        {isMention && (
                                            <button
                                                onClick={() => router.push(`/projects/${notif.related_id}`)}
                                                className="flex-1 sm:flex-none px-4 md:px-8 py-2 md:py-2.5 bg-amber-400 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/20 active:scale-95"
                                            >
                                                Reply
                                            </button>
                                        )}
                                        {isReview && (
                                            <button
                                                disabled={!!processingId}
                                                onClick={() => handleAction(notif.id, 'approve', notif.related_id)}
                                                className="flex-1 sm:flex-none px-4 md:px-8 py-2 md:py-2.5 bg-[#6366f1] text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-[#5558e3] transition-all shadow-lg shadow-[#6366f1]/20 active:scale-95 disabled:opacity-50"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {config.label === 'Invitation' && (
                                            <>
                                                <button
                                                    disabled={!!processingId}
                                                    onClick={() => handleAction(notif.id, 'accept', notif.related_id)}
                                                    className="flex-1 sm:flex-none px-4 md:px-8 py-2 md:py-2.5 bg-green-500 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 active:scale-95 disabled:opacity-50"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    disabled={!!processingId}
                                                    onClick={() => handleAction(notif.id, 'reject', notif.related_id)}
                                                    className="flex-1 sm:flex-none px-4 md:px-8 py-2 md:py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    Decline
                                                </button>
                                            </>
                                        )}
                                        {config.label !== 'Invitation' && (
                                            <button
                                                className="flex-1 sm:flex-none px-4 md:px-8 py-2 md:py-2.5 bg-gray-50 dark:bg-slate-800 text-gray-500 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Eye size={12} /> View
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            {index < filteredNotifications.length - 1 && (
                                <div className="mx-8 h-px bg-gray-100/80 dark:bg-slate-800/50" />
                            )}
                        </div>
                    )
                }) : (
                    <div className="py-40 text-center animate-in fade-in duration-1000">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-slate-900 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                            <Bell size={40} className="text-gray-200" />
                        </div>
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Inbox is empty</p>
                    </div>
                )}
            </div>
        </div>
    )
}
