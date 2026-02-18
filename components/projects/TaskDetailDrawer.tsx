'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Calendar, CheckCircle2, Clock, Circle, AlertCircle, User, Trash2,
    Tag, Layout, MessageSquare, History, AtSign, Send, Paperclip,
    MoreHorizontal, ChevronRight, Hash, Shield, Flag, X, FileText
} from 'lucide-react'
import { updateTask, deleteTask } from '@/lib/tasks/actions'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface TaskDetailDrawerProps {
    task: any
    projectId: string
    onClose: () => void
    canManage?: boolean
}

export default function TaskDetailDrawer({ task, projectId, onClose, canManage = false }: TaskDetailDrawerProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'all' | 'logs' | 'comments'>('all')
    const [newComment, setNewComment] = useState('')
    const [activities, setActivities] = useState<any[]>([])
    const [comments, setComments] = useState<any[]>([])

    const [status, setStatus] = useState(task.status)
    const [priority, setPriority] = useState(task.priority)
    const [userRole, setUserRole] = useState<string>('viewer')
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [userTeams, setUserTeams] = useState<string[]>([])
    const [mentionSearch, setMentionSearch] = useState('')
    const [showMentions, setShowMentions] = useState(false)
    const [projectMembers, setProjectMembers] = useState<any[]>([])
    const [teamInfo, setTeamInfo] = useState<any>(null)

    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchActivities()
        fetchComments()
        fetchProjectMembers()
        fetchUserRole()
        if (task.team_id) fetchTeamInfo()
    }, [task.id])

    const fetchTeamInfo = async () => {
        const { data } = await supabase
            .from('teams')
            .select('name')
            .eq('id', task.team_id)
            .single()
        setTeamInfo(data)
    }

    const fetchUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUserId(user.id)

        const { data: member } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single()

        setUserRole(member?.role || 'viewer')

        const { data: teams } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)

        setUserTeams(teams?.map(t => t.team_id) || [])
    }

    const fetchActivities = async () => {
        const { data } = await supabase
            .from('activities')
            .select('*, user:user_id(full_name, avatar_url)')
            .eq('task_id', task.id)
            .order('created_at', { ascending: false })
        setActivities(data || [])
    }

    const fetchComments = async () => {
        const { data } = await supabase
            .from('comments')
            .select('*, user:user_id(id, full_name, avatar_url)')
            .eq('task_id', task.id)
            .order('created_at', { ascending: true })
        setComments(data || [])
    }

    const fetchProjectMembers = async () => {
        const { data } = await supabase
            .from('project_members')
            .select('users:user_id(id, full_name, email)')
            .eq('project_id', projectId)
        setProjectMembers(data?.map((m: any) => m.users) || [])
    }

    const handleUpdate = async (updates: any) => {
        if (userRole === 'viewer') return
        setLoading(true)
        try {
            await updateTask(task.id, updates)
            router.refresh()
        } catch (error) {
            console.error('Failed to update task:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from('comments').insert({
            task_id: task.id,
            user_id: user.id,
            content: newComment
        })

        if (!error) {
            setNewComment('')
            fetchComments()
        }
    }

    const combinedActivity = [
        ...activities.map(a => ({ ...a, category: 'log' })),
        ...comments.map(c => ({
            id: c.id,
            type: 'comment',
            message: c.content,
            created_at: c.created_at,
            user: c.user,
            category: 'comment'
        }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const filteredActivity = combinedActivity.filter(a => {
        if (activeTab === 'all') return true
        return a.category === (activeTab === 'comments' ? 'comment' : 'log')
    })

    const formatLabel = (label: string) => {
        if (!label) return ''
        return label.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'To Do'
            case 'in_progress': return 'Doing'
            case 'completed': return 'Done'
            default: return formatLabel(status)
        }
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 animate-in slide-in-from-right duration-300">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-8 space-y-6">
                    {/* Title Section (Read-only input style) */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Title</label>
                        <div className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl text-sm font-black text-gray-900 dark:text-slate-100 uppercase tracking-tightest">
                            {task.title}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Team Section */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Team</label>
                            <div className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-gray-900 dark:text-slate-100">
                                {formatLabel(teamInfo?.name || task.team?.name || 'CENTRAL_OPS')}
                            </div>
                        </div>

                        {/* Assignee Section */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Assignee</label>
                            <div className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-slate-100">
                                <div className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-500 shrink-0">
                                    {task.assignee?.full_name?.[0] || 'U'}
                                </div>
                                <span className="truncate">{task.assignee?.full_name || 'Unassigned'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Status Section */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Status</label>
                            <div className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs font-bold text-gray-900 dark:text-slate-100">
                                <span className="uppercase tracking-widest">{getStatusLabel(status)}</span>
                                <div className={`w-2 h-2 rounded-full ${status === 'completed' ? 'bg-emerald-500' :
                                        status === 'in_progress' ? 'bg-amber-500' :
                                            'bg-indigo-400'
                                    } shadow-[0_0_10px_-2px_rgba(0,0,0,0.1)]`} />
                            </div>
                        </div>

                        {/* Priority Section */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Priority</label>
                            <div className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs font-bold text-gray-900 dark:text-slate-100">
                                <span className="uppercase tracking-widest">{formatLabel(priority)}</span>
                                <Flag size={12} className={
                                    priority === 'high' ? 'text-rose-500' :
                                        priority === 'medium' ? 'text-amber-500' :
                                            'text-indigo-400'
                                } />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Due Date Section */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Due Date</label>
                            <div className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-slate-100">
                                <Calendar size={14} className="text-gray-400" />
                                {task.due_date ? format(new Date(task.due_date), 'MMMM dd, yyyy') : 'No Date Set'}
                            </div>
                        </div>

                        {/* Task ID / Reference */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Reference ID</label>
                            <div className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                <Hash size={12} className="text-gray-400" />
                                {task.reference_code || task.id.slice(0, 8)}
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Operational Details</label>
                        <div className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl text-[13px] font-bold text-gray-600 dark:text-slate-400 min-h-[100px] leading-relaxed">
                            {task.description || 'No operational details logged for this objective.'}
                        </div>
                    </div>

                    {/* Mentions / Discussion Preview */}
                    <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-slate-800/50">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Commitments & Discussion</label>

                        {/* Write Comment simplified like description but smaller */}
                        <form onSubmit={handleCommentSubmit} className="relative group">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="w-full pl-5 pr-12 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-gray-700 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] transition-all min-h-[48px] max-h-32 shadow-sm placeholder:font-medium"
                                placeholder="Add a comment or update..."
                            />
                            <button
                                type="submit"
                                className="absolute right-2 bottom-2 p-2 bg-[#6366f1] text-white rounded-xl hover:bg-[#5558e3] shadow-lg shadow-[#6366f1]/20 active:scale-95 transition-all"
                            >
                                <Send size={14} />
                            </button>
                        </form>

                        <div className="space-y-4 mt-6">
                            {comments.slice().reverse().map((c, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-gray-50 dark:border-slate-800/50 shadow-sm transition-all hover:shadow-md">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 text-[10px] font-black text-indigo-500 border border-indigo-100 dark:border-indigo-500/20">
                                        {c.user?.full_name?.[0] || 'U'}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight">{c.user?.full_name}</span>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(c.created_at), 'MMM dd')}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-600 dark:text-slate-400 font-medium leading-relaxed">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-8 border-t border-gray-50 dark:border-slate-800/50 relative shrink-0 flex">
                <button
                    onClick={() => {
                        setStatus('in_progress')
                        handleUpdate({ status: 'in_progress' })
                    }}
                    disabled={userRole === 'viewer' || (userRole === 'member' && task.assigned_to !== currentUserId)}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-50 dark:hover:bg-slate-900 ${status === 'in_progress' ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'
                        } disabled:opacity-50`}
                >
                    {status === 'in_progress' ? 'Already Doing' : 'Mark as Doing'}
                </button>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-50 dark:bg-slate-800/50" />
                <button
                    onClick={() => {
                        setStatus('completed')
                        handleUpdate({ status: 'completed' })
                    }}
                    disabled={userRole === 'viewer' || (userRole === 'member' && task.assigned_to !== currentUserId)}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-50 dark:hover:bg-slate-900 ${status === 'completed' ? 'text-emerald-500' : 'text-[#6366f1] hover:text-emerald-500'
                        } disabled:opacity-50`}
                >
                    {status === 'completed' ? 'Tasks Done' : 'Mark as Done'}
                </button>
            </div>
        </div>
    )
}
