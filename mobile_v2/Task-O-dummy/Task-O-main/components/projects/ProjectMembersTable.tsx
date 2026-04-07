'use client'

import { useState } from 'react'
import { MoreVertical, Shield, User as UserIcon, Trash2, Check, X } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ConfirmationModal from '../ui/ConfirmationModal'

interface ProjectMembersTableProps {
    members: any[]
    currentUserRole: string
    projectId: string
    currentUserId: string
}

export default function ProjectMembersTable({ members, currentUserRole, projectId, currentUserId }: ProjectMembersTableProps) {
    const router = useRouter()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [newRole, setNewRole] = useState('')
    const [loading, setLoading] = useState<string | null>(null)
    const [memberToRemove, setMemberToRemove] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const canManage = currentUserRole === 'admin' || currentUserRole === 'manager'

    const handleUpdateRole = async (memberId: string) => {
        setLoading(memberId)
        try {
            const { error } = await supabase
                .from('project_members')
                .update({ role: newRole })
                .eq('id', memberId)

            if (error) throw error
            setEditingId(null)
            router.refresh()
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(null)
        }
    }

    const handleRemoveMember = async (memberId: string) => {
        setLoading(memberId)
        try {
            const { error } = await supabase
                .from('project_members')
                .delete()
                .eq('id', memberId)

            if (error) throw error
            setMemberToRemove(null)
            router.refresh()
        } catch (error: any) {
            setError(error.message)
            setMemberToRemove(null)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-900/40 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 backdrop-blur-xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-slate-800/50">
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Member</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Role</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                        {members.map((member) => {
                            const u = member.user as any
                            const isMe = u.id === currentUserId
                            const isEditing = editingId === member.id

                            return (
                                <tr key={member.id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 overflow-hidden flex items-center justify-center text-[#6366f1] text-lg font-black shadow-sm">
                                                {u.avatar_url ? (
                                                    <Image
                                                        src={u.avatar_url}
                                                        alt={u.full_name || 'Member'}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    u.full_name?.[0] || u.email?.[0]
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[15px] font-bold text-gray-900 dark:text-slate-100 leading-none mb-1.5 flex items-center gap-2">
                                                    {u.full_name || 'Generic User'}
                                                    {isMe && <span className="text-[10px] text-[#6366f1] bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg tracking-normal font-black uppercase">You</span>}
                                                </p>
                                                <p className="text-[11px] font-medium text-gray-400 dark:text-slate-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={newRole}
                                                    onChange={(e) => setNewRole(e.target.value)}
                                                    className="text-xs font-bold text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="member">Member</option>
                                                </select>
                                                <button
                                                    onClick={() => handleUpdateRole(member.id)}
                                                    disabled={loading === member.id}
                                                    className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl transition-all"
                                                >
                                                    <Check size={20} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${member.role === 'admin' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20' :
                                                member.role === 'manager' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' :
                                                    'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-100 dark:border-slate-700'
                                                }`}>
                                                {member.role === 'admin' ? <Shield size={12} className="text-purple-500" /> : <UserIcon size={12} className="text-gray-400" />}
                                                {member.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        {canManage && !isMe && member.role !== 'admin' && (
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(member.id)
                                                        setNewRole(member.role)
                                                    }}
                                                    className="p-2.5 text-gray-400 hover:text-[#6366f1] hover:bg-white dark:hover:bg-slate-800 rounded-[14px] shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-slate-700 transition-all"
                                                    title="Edit Role"
                                                >
                                                    <Shield size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setMemberToRemove(member.id)}
                                                    disabled={loading === member.id}
                                                    className="px-4 py-2 text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-all"
                                                >
                                                    {loading === member.id ? '...' : 'Remove'}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {members.length === 0 && (
                <div className="p-24 text-center">
                    <p className="text-sm text-gray-400 dark:text-slate-500 font-bold italic">No members found in this project.</p>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!memberToRemove}
                onClose={() => setMemberToRemove(null)}
                onConfirm={() => memberToRemove && handleRemoveMember(memberToRemove)}
                title="Personnel Termination"
                message="Are you sure you want to remove this member from the project? This will revoke their access to all tasks and discussion channels immediately."
                confirmLabel="Confirm Removal"
                type="danger"
            />

            <ConfirmationModal
                isOpen={!!error}
                onClose={() => setError(null)}
                onConfirm={() => setError(null)}
                title="System Conflict"
                message={error || 'An unexpected error occurred during access modification.'}
                confirmLabel="Acknowledge"
                type="warning"
            />
        </div>
    )
}
