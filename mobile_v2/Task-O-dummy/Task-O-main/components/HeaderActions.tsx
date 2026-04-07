'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Bell, CheckCircle2, Layout, Calendar, Clock, AlertCircle, Users, Sun, Moon, UserPlus, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import CreateTaskModal from './projects/CreateTaskModal'
import CreateProjectModal from './projects/CreateProjectModal'
import InviteMemberModal from './InviteMemberModal'
import CreateTeamModal from './teams/CreateTeamModal'
import { markAllNotificationsAsRead, clearAllNotifications as clearAllAction } from '@/lib/notifications/actions'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Link from 'next/link'
import { respondToPlatformInvitation } from '@/lib/users/actions'
import { useRouter } from 'next/navigation'
import Modal from './ui/Modal'

interface HeaderActionsProps {
    currentUser: any
}

export default function HeaderActions({ currentUser }: HeaderActionsProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const router = useRouter()
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [mounted, setMounted] = useState(false)
    const [approvalAlert, setApprovalAlert] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null)
    const { theme, setTheme } = useTheme()
    const createDropdownRef = useRef<HTMLDivElement>(null)
    const notificationsDropdownRef = useRef<HTMLDivElement>(null)

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (createDropdownRef.current && !createDropdownRef.current.contains(event.target as Node)) {
                setIsCreateOpen(false)
            }
            if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchNotifications = useCallback(async () => {
        if (!currentUser?.id) return
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(10)

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.read).length)
        }
    }, [currentUser?.id])

    useEffect(() => {
        if (!currentUser?.id) return
        fetchNotifications()

        const channel = supabase
            .channel('notifications-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${currentUser.id}`,
                },
                (payload) => {
                    fetchNotifications()

                    const newNotif = payload.new as any
                    if (newNotif && newNotif.type === 'task_status_change' && newNotif.message) {
                        if (newNotif.message.startsWith('Approved:')) {
                            setApprovalAlert({ title: 'Task Approved', message: newNotif.message, type: 'success' })
                        } else if (newNotif.message.startsWith('Rejected:')) {
                            setApprovalAlert({ title: 'Task Rejected', message: newNotif.message, type: 'error' })
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentUser?.id, fetchNotifications])

    const markAllAsRead = async () => {
        if (!currentUser?.id) return
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', currentUser.id)
            .eq('read', false)
        fetchNotifications()
    }

    const markAsRead = async (id: string) => {
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id)
        fetchNotifications()
    }

    const clearAllNotifications = async () => {
        if (!currentUser?.id) return
        try {
            // Optimistic update
            setNotifications([])
            setUnreadCount(0)

            await clearAllAction()
            fetchNotifications()
        } catch (error) {
            console.error('Failed to clear notifications:', error)
            fetchNotifications() // Rollback
        }
    }

    const handleNotificationClick = async (n: any) => {
        const isActionable = ['workspace_invite', 'project_invite', 'invite', 'review_required', 'task_assignment', 'assignment'].includes(n.type) ||
            (n.type === 'task_status_change' && n.message?.toLowerCase().includes('review'))

        if (!n.read && !isActionable) await markAsRead(n.id)
        setIsNotificationsOpen(false)
        router.push('/inbox')
    }

    const handleInvitation = async (notificationId: string, projectId: string | undefined, accept: boolean) => {
        if (!projectId) return
        setProcessingId(notificationId)
        try {
            await respondToPlatformInvitation(projectId, accept)
            fetchNotifications()
            router.refresh()
        } catch (error) {
            console.error('Failed to respond to invitation:', error)
        } finally {
            setProcessingId(null)
        }
    }

    if (!currentUser) return null

    return (
        <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50/50 dark:bg-slate-800/40 text-gray-400 dark:text-slate-500 hover:text-[#6366f1] transition-all border border-gray-100 dark:border-slate-800/50 active:scale-95"
                title="Toggle Theme"
            >
                {mounted && (theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />)}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationsDropdownRef}>
                <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all relative ${isNotificationsOpen ? 'bg-[#f3f4ff] dark:bg-indigo-500/10 border-[#6366f1] text-[#6366f1]' : 'bg-white/50 dark:bg-slate-900/40 border-gray-100 dark:border-slate-800/50 text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm'}`}
                >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white dark:border-slate-950 rounded-full animate-annoying-glow"></span>
                    )}
                </button>

                {isNotificationsOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-5 border-b border-gray-50 dark:border-slate-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Notifications</span>
                                <div className="flex gap-3">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation()
                                                await markAllNotificationsAsRead()
                                                fetchNotifications()
                                            }}
                                            className="text-[9px] font-black text-[#6366f1] hover:text-[#5558e3] bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg uppercase tracking-wider transition-colors"
                                        >
                                            Mark Read
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation()
                                                await clearAllNotifications()
                                            }}
                                            className="text-[9px] font-black text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg uppercase tracking-wider transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-[#6366f1] bg-[#f3f4ff] dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg tracking-wider">{unreadCount}</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`w-full p-4 text-left border-b border-gray-50 dark:border-slate-800 last:border-none ${!n.read ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
                                    >
                                        <button
                                            onClick={() => handleNotificationClick(n)}
                                            className="w-full flex gap-3 text-left group"
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${n.type === 'task' || n.type === 'task_assignment' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
                                                n.type === 'workspace_invite' || n.type === 'invite' || n.type === 'project_invite' ? 'bg-green-50 dark:bg-green-500/10 text-green-500' :
                                                    'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500'
                                                }`}>
                                                {n.type === 'task' || n.type === 'task_assignment' ? <Clock size={16} /> :
                                                    n.type === 'workspace_invite' || n.type === 'invite' || n.type === 'project_invite' ? <UserPlus size={16} /> :
                                                        <AlertCircle size={16} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs mb-0.5 group-hover:text-[#6366f1] transition-colors ${!n.read ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>{n.title || n.message}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-slate-500 line-clamp-1 italic">{format(new Date(n.created_at), 'MMM dd, HH:mm')}</p>
                                            </div>
                                            {!n.read && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1] mt-1.5 flex-shrink-0"></div>
                                            )}
                                        </button>

                                        {(n.type === 'workspace_invite' || n.type === 'invite' || n.type === 'project_invite') && !n.read && (
                                            <div className="flex items-center gap-2 mt-3 pl-11">
                                                <button
                                                    disabled={!!processingId}
                                                    onClick={() => handleInvitation(n.id, n.related_id, true)}
                                                    className="px-3 py-1.5 bg-[#6366f1] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#5558e3] transition-all disabled:opacity-50"
                                                >
                                                    {processingId === n.id ? '...' : 'Accept'}
                                                </button>
                                                <button
                                                    disabled={!!processingId}
                                                    onClick={() => handleInvitation(n.id, n.related_id, false)}
                                                    className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center flex flex-col items-center">
                                    <Bell size={20} className="text-gray-200 dark:text-slate-800 mb-3" />
                                    <p className="text-[11px] font-medium text-gray-400 italic">No notifications yet</p>
                                </div>
                            )}
                        </div>
                        <Link href="/inbox" className="block text-center p-3 text-[10px] font-bold text-[#6366f1] hover:bg-gray-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest border-t border-gray-50 dark:border-slate-800">
                            See All
                        </Link>
                    </div>
                )}
            </div>

            {/* Create Dropdown */}
            <div className="relative" ref={createDropdownRef}>
                <button
                    id="tour-create-dropdown"
                    onClick={() => setIsCreateOpen(!isCreateOpen)}
                    className="flex items-center gap-2 bg-[#0077B6] text-white px-3 lg:px-4 py-2.5 rounded-xl hover:bg-[#0096C7] transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    <Plus size={18} />
                    <span className="hidden lg:inline text-[13px] font-black uppercase tracking-widest">Create</span>
                </button>

                {isCreateOpen && (
                    <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                        <button
                            id="tour-new-task-option"
                            onClick={() => {
                                setIsTaskModalOpen(true)
                                setIsCreateOpen(false)
                            }}
                            className="w-full h-11 flex items-center gap-3 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-[#6366f1] transition-all"
                        >
                            <Plus size={16} className="text-indigo-500" />
                            New Task
                        </button>
                        <button
                            onClick={() => {
                                setIsProjectModalOpen(true)
                                setIsCreateOpen(false)
                            }}
                            className="w-full h-11 flex items-center gap-3 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
                        >
                            <Layout size={16} className="text-emerald-500" />
                            New Project
                        </button>
                        <button
                            id="tour-new-team-option"
                            onClick={() => {
                                setIsTeamModalOpen(true)
                                setIsCreateOpen(false)
                            }}
                            className="w-full h-11 flex items-center gap-3 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 transition-all"
                        >
                            <Users size={16} className="text-blue-500" />
                            New Team
                        </button>
                        <button
                            id="tour-new-member-option"
                            onClick={() => {
                                setIsMemberModalOpen(true)
                                setIsCreateOpen(false)
                            }}
                            className="w-full h-11 flex items-center gap-3 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 transition-all border-t border-gray-50 dark:border-slate-800"
                        >
                            <UserPlus size={16} className="text-purple-500" />
                            New Member
                        </button>
                    </div>
                )}
            </div>

            <CreateTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
            />

            <CreateProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
            />

            <InviteMemberModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
            />

            <CreateTeamModal
                isOpen={isTeamModalOpen}
                onClose={() => setIsTeamModalOpen(false)}
            />

            {/* Global Approval/Rejection Listener Modal */}
            <Modal
                isOpen={!!approvalAlert}
                onClose={() => setApprovalAlert(null)}
                title={approvalAlert?.title || ''}
            >
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${approvalAlert?.type === 'success' ? 'bg-emerald-50 text-emerald-500 shadow-emerald-500/10' : 'bg-rose-50 text-rose-500 shadow-rose-500/10'}`}>
                        {approvalAlert?.type === 'success' ? <CheckCircle2 size={32} /> : <X size={32} />}
                    </div>
                    <p className="text-md font-bold text-gray-600 dark:text-slate-400 leading-relaxed">
                        {approvalAlert?.message}
                    </p>
                    <button
                        onClick={() => setApprovalAlert(null)}
                        className={`mt-4 px-8 py-3 rounded-xl text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg ${approvalAlert?.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </div>
    )
}
