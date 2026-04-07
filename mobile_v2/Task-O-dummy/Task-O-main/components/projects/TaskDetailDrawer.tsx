'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
    Calendar, CheckCircle2, Clock, Circle, AlertCircle, User, Trash2,
    Tag, Layout, MessageSquare, History, AtSign, Send, Paperclip,
    MoreHorizontal, ChevronRight, Hash, Shield, Flag, X, FileText, Pencil, ChevronDown
} from 'lucide-react'
import { updateTask, deleteTask } from '@/lib/tasks/actions'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import ConfirmationModal from '../ui/ConfirmationModal'
import Modal from '../ui/Modal'
import EditTaskModal from './EditTaskModal'

interface TaskDetailDrawerProps {
    task: any
    projectId: string
    onClose: () => void
    canManage?: boolean
}

export default function TaskDetailDrawer({ task, projectId, onClose, canManage = false }: TaskDetailDrawerProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'all' | 'logs' | 'comments'>('comments')
    const [newComment, setNewComment] = useState('')
    const [attachingFile, setAttachingFile] = useState<File | null>(null)
    const [uploadingAttachment, setUploadingAttachment] = useState(false)
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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [showMoreButton, setShowMoreButton] = useState(false)
    const [actionModal, setActionModal] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null)

    useEffect(() => {
        const el = scrollRef.current?.closest('.custom-scrollbar') || scrollRef.current
        if (!el) return

        const handleScroll = () => {
            const canScroll = el.scrollHeight > el.clientHeight
            const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
            setShowMoreButton(canScroll && !isAtBottom)
        }

        el.addEventListener('scroll', handleScroll)
        const timer = setTimeout(handleScroll, 500) // delay for load
        return () => {
            el.removeEventListener('scroll', handleScroll)
            clearTimeout(timer)
        }
    }, [activities, comments])
    const [isExiting, setIsExiting] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)

    const fetchTeamInfo = useCallback(async () => {
        const { data } = await supabase
            .from('teams')
            .select('name')
            .eq('id', task.team_id)
            .single()
        setTeamInfo(data)
    }, [task.team_id])

    const fetchUserRole = useCallback(async () => {
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
    }, [projectId])

    const fetchActivities = useCallback(async () => {
        const { data } = await supabase
            .from('activities')
            .select('*, user:user_id(full_name, avatar_url)')
            .eq('task_id', task.id)
            .order('created_at', { ascending: false })
        setActivities(data || [])
    }, [task.id])

    const fetchComments = useCallback(async () => {
        const { data } = await supabase
            .from('comments')
            .select('*, user:user_id(id, full_name, avatar_url)')
            .eq('task_id', task.id)
            .order('created_at', { ascending: true })
        setComments(data || [])
    }, [task.id])

    const fetchProjectMembers = useCallback(async () => {
        const { data } = await supabase
            .from('project_members')
            .select('users:user_id(id, full_name, email)')
            .eq('project_id', projectId)
        setProjectMembers(data?.map((m: any) => m.users) || [])
    }, [projectId])

    useEffect(() => {
        fetchActivities()
        fetchComments()
        fetchProjectMembers()
        fetchUserRole()
        setIsMounted(true)
        if (task.team_id) fetchTeamInfo()
    }, [task.id, task.team_id, fetchActivities, fetchComments, fetchProjectMembers, fetchUserRole, fetchTeamInfo])

    const handleUpdate = async (updates: any, skipClose = false) => {
        if (userRole === 'viewer') return
        setLoading(true)
        const startTime = Date.now()
        try {
            await updateTask(task.id, updates)
            router.refresh()
            const elapsed = Date.now() - startTime
            const delay = Math.max(0, 1700 - elapsed)

            if (!skipClose) {
                setTimeout(() => {
                    setIsExiting(true)
                    setTimeout(() => {
                        onClose()
                    }, 300)
                }, delay)
            } else {
                setLoading(false)
            }
        } catch (error) {
            console.error('Failed to update task:', error)
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        setLoading(true)
        const startTime = Date.now()
        try {
            await deleteTask(task.id)
            router.refresh()
            const elapsed = Date.now() - startTime
            const delay = Math.max(0, 1700 - elapsed)

            setTimeout(() => {
                setIsExiting(true)
                setTimeout(() => {
                    onClose()
                }, 300)
            }, delay)
        } catch (error: any) {
            console.error('Failed to delete task:', error)
            alert(error.message || 'Failed to delete task')
            setLoading(false)
        }
    }

    const handleCommentSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newComment.trim() && !attachingFile) return
        setUploadingAttachment(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let fileMarkdown = ''
            if (attachingFile) {
                const fileExt = attachingFile.name.split('.').pop()
                const safeName = attachingFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '')
                const filePath = `attachments/${task.id}/${Date.now()}-${safeName}`
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, attachingFile)

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath)
                    fileMarkdown = (newComment.trim() ? '\n\n' : '') + `[Attachment: ${attachingFile.name}](${publicUrl})`
                } else {
                    alert('Failed to upload attachment: ' + uploadError.message)
                    return
                }
            }

            const finalContent = newComment.trim() + fileMarkdown

            const { error } = await supabase.from('comments').insert({
                task_id: task.id,
                user_id: user.id,
                content: finalContent
            })

            if (!error) {
                setNewComment('')
                setAttachingFile(null)
                fetchComments()
            }
        } catch (err: any) {
            console.error('Comment Error:', err)
            alert('An error occurred submitting your comment.')
        } finally {
            setUploadingAttachment(false)
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
        <div className={`flex flex-col h-full bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out transform ${isMounted && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            {/* Scrollable Content */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
                    <div className="p-0 space-y-6">
                        {/* Execution Details */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FileText size={12} /> Task Description
                            </label>
                            <div className="p-5 bg-gray-50/50 dark:bg-slate-800/30 rounded-3xl border border-gray-50 dark:border-slate-800/50">
                                <p className="text-sm font-medium text-gray-700 dark:text-slate-300 leading-relaxed">
                                    {task.description || 'No task description provided.'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Team Section */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Team</label>
                                <div className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-gray-900 dark:text-slate-100">
                                    {formatLabel(teamInfo?.name || task.team?.name || 'No Team')}
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
                                            status === 'review' ? 'bg-indigo-500' :
                                                'bg-sky-400'
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



                        <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-slate-800">
                            {['comments', 'logs'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                                        : 'bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {tab === 'comments' ? 'Comments' : 'Status Logs'}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6">
                            {filteredActivity.map((a, idx) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center border bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-sm relative">
                                            <div className="w-full h-full rounded-xl bg-gray-50 dark:bg-slate-800/50 overflow-hidden flex items-center justify-center text-[10px] font-black text-indigo-500 uppercase">
                                                {a.user?.avatar_url ? (
                                                    <Image
                                                        src={a.user.avatar_url}
                                                        alt={a.user.full_name || 'User avatar'}
                                                        width={32}
                                                        height={32}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (a.user?.full_name?.[0] || 'U')}
                                            </div>
                                        </div>
                                        <div className="flex-1 w-px bg-gray-50 dark:bg-slate-800 group-last:hidden" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight">{a.user?.full_name}</span>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(a.created_at), 'MMM dd')}</span>
                                        </div>
                                        <div className="text-[11px] text-gray-600 dark:text-slate-400 font-medium leading-[1.6] whitespace-pre-wrap">
                                            {a.message.split(/(\[.*?\]\(.*?\))/g).map((part: string, i: number) => {
                                                const match = part.match(/\[(.*?)\]\((.*?)\)/);
                                                if (match) {
                                                    return (
                                                        <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all font-bold mt-1 shadow-sm border border-indigo-100 dark:border-indigo-500/20 w-max">
                                                            <Paperclip size={10} />
                                                            {match[1].replace('Attachment: ', '')}
                                                        </a>
                                                    );
                                                }
                                                return <span key={i}>{part}</span>;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Comment Input */}
                        <div className="mt-6">
                            <form onSubmit={(e) => handleCommentSubmit(e)} className="relative">
                                <div className="p-1 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-[28px] flex flex-col shadow-inner transition-focus-within focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="w-full bg-transparent border-none text-[13px] text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 p-4 pb-2 outline-none resize-none min-h-[60px] max-h-[150px]"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleCommentSubmit();
                                            }
                                        }}
                                    />
                                    <div className="p-2 flex items-center justify-between gap-2 mt-auto">
                                        {/* Attachments Section */}
                                        <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                                            <div className="relative shrink-0 mr-1">
                                                <label className={`w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${attachingFile ? 'bg-indigo-100 text-indigo-500 dark:bg-indigo-500/20' : 'bg-white dark:bg-slate-800 text-gray-400 hover:text-indigo-500 border border-gray-200 dark:border-slate-700 shadow-sm'}`}>
                                                    <Paperclip size={16} />
                                                    <input
                                                        type="file"
                                                        onChange={(e) => e.target.files && setAttachingFile(e.target.files[0])}
                                                        className="hidden"
                                                        disabled={uploadingAttachment}
                                                    />
                                                </label>
                                            </div>
                                            {attachingFile && (
                                                <div className="relative shrink-0 max-w-[200px]">
                                                    <div className="px-4 py-2 pr-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center gap-2 border border-indigo-100 dark:border-indigo-500/20">
                                                        <FileText size={12} className="text-indigo-500 shrink-0" />
                                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate">{attachingFile.name}</span>
                                                    </div>
                                                    <button type="button" onClick={() => setAttachingFile(null)} className="absolute top-1/2 -translate-y-1/2 right-2 w-4 h-4 bg-red-100 dark:bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition-all">
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={(!newComment.trim() && !attachingFile) || uploadingAttachment}
                                            className="w-10 h-10 shrink-0 bg-indigo-500 disabled:bg-gray-200 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-600 text-white rounded-2xl flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(99,102,241,0.4)] disabled:shadow-none hover:bg-indigo-600 transition-all active:scale-95 disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed"
                                        >
                                            {uploadingAttachment ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Send size={16} className="ml-0.5" />}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    {showMoreButton && (
                        <div className="absolute bottom-5 left-0 right-0 flex justify-center z-10">
                            <button
                                onClick={() => {
                                    const el = scrollRef.current?.closest('.custom-scrollbar') || scrollRef.current
                                    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
                                }}
                                className="bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md border border-gray-100/10 dark:border-slate-800/80 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-100 hover:scale-105 transition-all shadow-xl shadow-indigo-500/5 animate-bounce"
                            >
                                <ChevronDown size={14} className="text-indigo-500" />
                                More Contents Below
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Admin Actions */}
            {(userRole === 'admin' || userRole === 'manager' || userRole === 'tech_lead' || userRole === 'owner' || canManage || task.created_by === currentUserId) && (
                <div className="p-6 border-t border-gray-50 dark:border-slate-800/50 flex gap-4">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        disabled={loading}
                        className="flex-1 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-98 disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        <Pencil size={14} />
                        Edit Task
                    </button>
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={loading}
                        className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/10 hover:shadow-red-500/20 active:scale-98 disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        <Trash2 size={14} />
                        Delete Task
                    </button>
                </div>
            )}

            <EditTaskModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                task={task}
                onUpdate={() => {
                    fetchTeamInfo()
                    fetchUserRole()
                    fetchActivities()
                    fetchComments()
                    if (onClose) onClose()
                    router.refresh()
                }}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                confirmLabel="Delete Task"
                type="danger"
            />

            {/* Bottom Action Bar */}
            <div className="p-6 border-t border-gray-50 dark:border-slate-800/50 flex gap-4 relative shrink-0">
                {(status === 'pending' || status === 'todo') && (
                    <>
                        <button
                            onClick={() => { setStatus('in_progress'); handleUpdate({ status: 'in_progress' }) }}
                            disabled={userRole === 'viewer' || (userRole === 'member' && task.assigned_to !== currentUserId && !canManage)}
                            className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-98 disabled:opacity-50"
                        >
                            <Circle size={14} className="animate-pulse" />
                            Start Doing
                        </button>
                        <button
                            onClick={() => { setStatus('review'); handleUpdate({ status: 'review' }) }}
                            disabled={userRole === 'viewer' || (userRole === 'member' && task.assigned_to !== currentUserId && !canManage)}
                            className="flex-1 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-98 disabled:opacity-50"
                        >
                            <CheckCircle2 size={14} />
                            Submit for Review
                        </button>
                    </>
                )}

                {status === 'in_progress' && (
                    <>
                        <button
                            onClick={() => { setStatus('pending'); handleUpdate({ status: 'pending' }) }}
                            disabled={userRole === 'viewer' || (userRole === 'member' && task.assigned_to !== currentUserId && !canManage)}
                            className="flex-1 py-3.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                        >
                            <History size={14} />
                            Revert to Todo
                        </button>
                        <button
                            onClick={() => { setStatus('review'); handleUpdate({ status: 'review' }) }}
                            disabled={userRole === 'viewer' || (userRole === 'member' && task.assigned_to !== currentUserId && !canManage)}
                            className="flex-1 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-98 disabled:opacity-50"
                        >
                            <CheckCircle2 size={14} />
                            Submit for Review
                        </button>
                    </>
                )}

                {status === 'review' && (
                    (userRole === 'admin' || userRole === 'owner' || userRole === 'manager' || canManage || task.created_by === currentUserId) ? (
                        <>
                            <button
                                disabled={loading}
                                onClick={async () => {
                                    setStatus('in_progress');
                                    await handleUpdate({ status: 'in_progress' }, true);
                                    setActionModal({ title: 'Task Rejected', message: 'The task has been rejected and moved back to In Progress.', type: 'error' })
                                }}
                                className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 active:scale-98 disabled:opacity-50"
                            >
                                <X size={14} />
                                Reject Task
                            </button>
                            <button
                                disabled={loading}
                                onClick={async () => {
                                    setStatus('completed');
                                    await handleUpdate({ status: 'completed' }, true);
                                    setActionModal({ title: 'Task Approved', message: 'The task has been successfully approved and moved to Done.', type: 'success' })
                                }}
                                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-98 disabled:opacity-50"
                            >
                                <CheckCircle2 size={14} />
                                Approve & Done
                            </button>
                        </>
                    ) : (
                        <div className="w-full py-3.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-500/20">
                            <Shield size={14} />
                            Pending Admin Review
                        </div>
                    )
                )}

                {status === 'completed' && (
                    <button
                        onClick={() => { setStatus('in_progress'); handleUpdate({ status: 'in_progress' }) }}
                        disabled={userRole === 'viewer' || (userRole === 'member' && task.assigned_to !== currentUserId && !canManage)}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-98 disabled:opacity-50"
                    >
                        <History size={14} />
                        Reopen Task (In Progress)
                    </button>
                )}
            </div>

            {/* Action Feedback Modal */}
            <Modal
                isOpen={!!actionModal}
                onClose={() => {
                    setActionModal(null)
                    setIsExiting(true)
                    setTimeout(() => {
                        onClose()
                    }, 300)
                }}
                title={actionModal?.title || ''}
            >
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${actionModal?.type === 'success' ? 'bg-emerald-50 text-emerald-500 shadow-emerald-500/10' : 'bg-rose-50 text-rose-500 shadow-rose-500/10'}`}>
                        {actionModal?.type === 'success' ? <CheckCircle2 size={32} /> : <X size={32} />}
                    </div>
                    <p className="text-md font-bold text-gray-600 dark:text-slate-400 leading-relaxed">
                        {actionModal?.message}
                    </p>
                    <button
                        onClick={() => {
                            setActionModal(null)
                            setIsExiting(true)
                            setTimeout(() => {
                                onClose()
                            }, 300)
                        }}
                        className={`mt-4 px-8 py-3 rounded-xl text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg ${actionModal?.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </div >
    )
}
