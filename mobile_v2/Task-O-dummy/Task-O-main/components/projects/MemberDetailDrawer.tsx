'use client'

import {
    Shield, Mail, Calendar, Trash2, User, Key, LayoutDashboard, Clock, AlertCircle, CheckCircle2, BarChart3, ChevronRight
} from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import UpdateRoleModal from './UpdateRoleModal'
import ConfirmationModal from '../ui/ConfirmationModal'

interface MemberDetailDrawerProps {
    member: any
    projectId: string
    isAdmin: boolean
    currentUserId: string
    ownerId: string
    onClose: () => void
}

export default function MemberDetailDrawer({
    member,
    projectId,
    isAdmin,
    currentUserId,
    ownerId,
    onClose
}: MemberDetailDrawerProps) {
    const router = useRouter()
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
    const [isConfirmingRemove, setIsConfirmingRemove] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const isSelf = member.user.id === currentUserId
    const isOwner = member.user.id === ownerId

    const fetchMemberTasks = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .eq('assigned_to', member.user.id)
            .order('updated_at', { ascending: false })

        setTasks(data || [])
        setLoading(false)
    }, [member.user.id, projectId])

    useEffect(() => {
        fetchMemberTasks()
    }, [fetchMemberTasks])

    const activeCount = tasks.filter(t => t.status === 'in_progress').length
    const completedCount = tasks.filter(t => t.status === 'completed').length
    const overdueCount = tasks.filter(t => {
        if (t.status === 'completed') return false
        if (!t.due_date) return false
        return new Date(t.due_date) < new Date()
    }).length

    const handleRemove = async () => {
        try {
            const { error } = await supabase
                .from('project_members')
                .delete()
                .eq('id', member.id)

            if (error) throw error
            setIsConfirmingRemove(false)
            onClose()
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setIsConfirmingRemove(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header Profile */}
            <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-gray-50 dark:border-slate-800/50">
                <div className="w-24 h-24 rounded-[32px] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#6366f1] text-3xl font-black border border-indigo-100 dark:border-indigo-500/20 overflow-hidden shadow-xl">
                    {member.user.avatar_url ? (
                        <Image
                            src={member.user.avatar_url}
                            alt={member.user.full_name || 'Member'}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        member.user.full_name?.[0] || 'U'
                    )}
                </div>
                <div>
                    <h1 className="text-xl font-black text-gray-900 dark:text-slate-50 uppercase tracking-tightest leading-none mb-1">
                        {member.user.full_name || 'Anonymous User'}
                    </h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                        Member
                    </p>
                </div>
            </div>

            {/* Workload Scorecard */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-indigo-50/50 dark:bg-indigo-500/5 p-4 rounded-3xl border border-indigo-100/50 dark:border-indigo-500/10 text-center">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Active</p>
                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{activeCount}</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-4 rounded-3xl border border-emerald-100/50 dark:border-emerald-500/10 text-center">
                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Resolved</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{completedCount}</p>
                </div>
                <div className="bg-rose-50/50 dark:bg-rose-500/5 p-4 rounded-3xl border border-rose-100/50 dark:border-rose-500/10 text-center">
                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Critical</p>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-400">{overdueCount}</p>
                </div>
            </div>

            {/* Account Details */}
            <div className="space-y-6">
                <div className="flex items-center justify-between p-5 rounded-3xl bg-gray-50/50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-500 truncate max-w-[180px]">{member.user.email}</span>
                    </div>
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Primary Email</span>
                </div>

                <div className="flex items-center justify-between p-5 rounded-3xl bg-gray-50/50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-500">
                            {member.joined_at ? format(new Date(member.joined_at), 'MMM dd, yyyy') : 'Unknown'}
                        </span>
                    </div>
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Joined Workspace</span>
                </div>
            </div>

            {/* Access Management */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 size={12} className="text-[#6366f1]" />
                    Project Progress
                </h3>
                <div className="p-6 rounded-[32px] border border-gray-100 dark:border-slate-800/50 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest">Active Role</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] text-gray-400 italic capitalize">{member.role}</p>
                                {isAdmin && !isOwner && !isSelf && (
                                    <button
                                        onClick={() => setIsRoleModalOpen(true)}
                                        className="text-[8px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 underline decoration-indigo-200 underline-offset-4 transition-all"
                                    >
                                        Modify Access
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className={`p-2 rounded-xl border ${member.role === 'admin' ? 'bg-indigo-50 border-indigo-100 text-[#6366f1] dark:bg-indigo-500/10 dark:border-indigo-500/20' : 'bg-gray-50 border-gray-100 text-gray-400 dark:bg-slate-800 dark:border-slate-700'}`}>
                            <Shield size={16} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest">Status</p>
                            <p className="text-[10px] text-gray-400 italic mt-0.5 capitalize">{member.status}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${member.status === 'accepted' ? 'bg-green-50 text-green-600 dark:bg-green-500/10' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'}`}>
                            {member.status}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Manifest */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-widest flex items-center gap-2">
                    <LayoutDashboard size={12} className="text-[#6366f1]" />
                    Task List
                </h3>
                <div className="space-y-3">
                    {tasks.length > 0 ? tasks.map(task => (
                        <div key={task.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-gray-100 dark:border-slate-800/50 hover:border-[#6366f1]/30 transition-all flex items-center justify-between group">
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight">{task.title}</p>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${task.status === 'completed' ? 'text-emerald-500' :
                                        task.status === 'in_progress' ? 'text-amber-500' :
                                            task.status === 'review' ? 'text-indigo-500' : 'text-gray-400'
                                        }`}>
                                        {task.status}
                                    </span>
                                    {task.due_date && (
                                        <span className="text-[8px] font-bold text-gray-400 flex items-center gap-1">
                                            <Clock size={8} /> {format(new Date(task.due_date), 'MMM dd')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-[#6366f1] transition-colors" />
                        </div>
                    )) : (
                        <div className="py-8 text-center bg-gray-50/50 dark:bg-slate-800/20 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">No assigned objectives</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            {isAdmin && !isOwner && !isSelf && (
                <div className="pt-6 border-t border-gray-50 dark:border-slate-800/50">
                    <button
                        onClick={() => setIsConfirmingRemove(true)}
                        className="w-full py-4 bg-red-50/50 dark:bg-red-500/5 hover:bg-red-50 dark:hover:bg-red-500/10 text-[10px] font-black text-red-500 uppercase tracking-widest rounded-2xl transition-all border border-transparent flex items-center justify-center gap-2 group"
                    >
                        <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                        Remove Member
                    </button>
                </div>
            )}

            <ConfirmationModal
                isOpen={isConfirmingRemove}
                onClose={() => setIsConfirmingRemove(false)}
                onConfirm={handleRemove}
                title="Personnel Termination"
                message={`Are you sure you want to remove ${member.user.full_name || 'this member'}? This will revoke all their access to the personnel hub and active tasks.`}
                confirmLabel="Remove Member"
                type="danger"
            />

            <ConfirmationModal
                isOpen={!!error}
                onClose={() => setError(null)}
                onConfirm={() => setError(null)}
                title="System Alert"
                message={error || 'An unknown error occurred'}
                confirmLabel="Acknowledge"
                type="warning"
            />

            <UpdateRoleModal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                member={{
                    id: member.id,
                    user_id: member.user.id,
                    full_name: member.user.full_name,
                    email: member.user.email,
                    role: member.role
                }}
                projectId={projectId}
            />
        </div>
    )
}
