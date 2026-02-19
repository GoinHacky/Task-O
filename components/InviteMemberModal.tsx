'use client'

import { useState, useEffect } from 'react'
import { UserPlus, CheckCircle2, AlertCircle, Shield, User as UserIcon, Eye, Users, MessageSquare, ChevronDown, Check, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { inviteUserToWorkspace } from '@/lib/users/actions'
import { supabase } from '@/lib/supabase/client'

interface InviteMemberModalProps {
    isOpen: boolean
    onClose: () => void
    projectId?: string
    initialTeamId?: string
    onSuccess?: () => void
}

export default function InviteMemberModal({ isOpen, onClose, projectId, initialTeamId, onSuccess }: InviteMemberModalProps) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(initialTeamId ? [initialTeamId] : [])
    const [message, setMessage] = useState('')

    const [teams, setTeams] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            fetchTeams()
        }
    }, [isOpen, projectId])

    const fetchTeams = async () => {
        let query = supabase.from('teams').select('id, name')
        if (projectId) {
            query = query.eq('project_id', projectId)
        }
        const { data } = await query
        setTeams(data || [])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)
        setError(null)
        try {
            await inviteUserToWorkspace(email, role, selectedTeamIds, projectId, message)
            setSuccess(true)
            resetForm()
            if (onSuccess) onSuccess()
            setTimeout(() => {
                setSuccess(false)
                onClose()
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setEmail('')
        setRole('member')
        setSelectedTeamIds(initialTeamId ? [initialTeamId] : [])
        setMessage('')
    }

    const toggleTeam = (teamId: string) => {
        setSelectedTeamIds(prev =>
            prev.includes(teamId)
                ? prev.filter(id => id !== teamId)
                : [...prev, teamId]
        )
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Invite Member"
            helperText="Invite collaborators to your project"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-900 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !email}
                        className="flex-1 py-4 text-[10px] font-black text-[#6366f1] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Send Invite'}
                    </button>
                </>
            }
        >
            {success ? (
                <div className="py-8 text-center animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-50 text-emerald-500 mb-4 border border-emerald-100">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-slate-50 uppercase tracking-tight">Invitation Sent</h3>
                    <p className="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Invitation to {email} sent
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-600 animate-in slide-in-from-top-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email *</label>
                        <input
                            autoFocus
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-100"
                            placeholder="name@company.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Role *</label>
                        <div className="relative group">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-100 appearance-none"
                            >
                                <option value="admin">Admin</option>
                                <option value="tech_lead">Tech Lead</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    )
}
