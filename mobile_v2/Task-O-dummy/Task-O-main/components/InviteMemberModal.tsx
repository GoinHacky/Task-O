'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserPlus, CheckCircle2, AlertCircle, Shield, User as UserIcon, Eye, Users, MessageSquare, ChevronDown, Check, X, Layout, Plus } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { inviteUserToWorkspace } from '@/lib/users/actions'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { useGuidedTour } from '@/components/GuidedTour'

interface InviteMemberModalProps {
    isOpen: boolean
    onClose: () => void
    projectId?: string
    initialTeamId?: string
    onSuccess?: () => void
}

export default function InviteMemberModal({ isOpen, onClose, projectId: initialProjectId, initialTeamId, onSuccess }: InviteMemberModalProps) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(initialTeamId ? [initialTeamId] : [])
    const [message, setMessage] = useState('')
    const [projectId, setProjectId] = useState(initialProjectId || '')

    const [projects, setProjects] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isFetchingInitial, setIsFetchingInitial] = useState(true)
    const { nextStep, endTour, isActive, startTour } = useGuidedTour()

    const fetchInitialData = useCallback(async () => {
        setIsFetchingInitial(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch Projects
        const { data: userProjects } = await supabase
            .from('project_members')
            .select('project:project_id(id, name)')
            .eq('user_id', user.id)
            .in('role', ['admin', 'manager'])

        const projectsList = userProjects?.map((p: any) => p.project).filter(Boolean) || []
        setProjects(projectsList)

        if (projectsList.length > 0 && !projectId) {
            setProjectId(projectsList[0].id)
        }
        setIsFetchingInitial(false)
    }, [projectId])

    useEffect(() => {
        if (isOpen) {
            fetchInitialData()
        }
    }, [isOpen, fetchInitialData])

    useEffect(() => {
        const fetchTeams = async () => {
            if (!projectId) {
                setTeams([])
                return
            }
            const { data } = await supabase
                .from('teams')
                .select('id, name')
                .eq('project_id', projectId)
            setTeams(data || [])
        }

        if (isOpen) {
            fetchTeams()
        }
    }, [isOpen, projectId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)
        setError(null)
        try {
            const result = await inviteUserToWorkspace(email, role, selectedTeamIds, projectId, message)
            if (result?.error) {
                setError(result.error)
                return
            }
            setSuccess(true)
            resetForm()
            if (onSuccess) onSuccess()
            if (isActive) nextStep()
            setTimeout(() => {
                setSuccess(false)
                onClose()
            }, 2000)
        } catch (err: any) {
            console.error('Client-side error in InviteMemberModal:', err)
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
        setProjectId(initialProjectId || '')
    }

    const toggleTeam = (teamId: string) => {
        setSelectedTeamIds(prev =>
            prev.includes(teamId)
                ? prev.filter(id => id !== teamId)
                : [...prev, teamId]
        )
    }

    const noProjects = !isFetchingInitial && projects.length === 0

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose()
                if (isActive) endTour()
            }}
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
                    {!noProjects && (
                        <button
                            id="tour-invite-submit-btn"
                            onClick={handleSubmit}
                            disabled={loading || !email || !projectId}
                            className="flex-1 py-4 text-[10px] font-black text-[#6366f1] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send Invite'}
                        </button>
                    )}
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
            ) : noProjects ? (
                <div className="py-12 px-6 text-center animate-in fade-in zoom-in duration-500 bg-gray-50/50 dark:bg-slate-900/50 rounded-[32px] border border-dashed border-gray-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/5 transition-transform hover:scale-110 duration-500">
                        <Users size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">No Projects Found</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 leading-relaxed">
                        Collaborators need a project to join. Create one first to start inviting.
                    </p>
                    <Link
                        href="/projects"
                        id="tour-invite-no-projects-link"
                        onClick={onClose}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-[#6366f1] text-white text-[10px] font-black rounded-xl hover:bg-[#5558e3] transition-all shadow-lg shadow-indigo-500/20 active:scale-95 uppercase tracking-[0.2em]"
                    >
                        <Plus size={14} strokeWidth={2.5} /> Create My First Project
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-600 animate-in slide-in-from-top-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Parent Project *</label>
                            <div className="relative group">
                                <select
                                    id="tour-invite-project-select"
                                    required
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-100 appearance-none"
                                >
                                    <option value="">Select Project...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email *</label>
                            <input
                                id="tour-invite-email-input"
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
                                    id="tour-invite-role-select"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as any)}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-100 appearance-none"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="member">Member</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {teams.length > 0 && (
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Assign to Teams</label>
                                <div className="max-h-32 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                                    {teams.map((team, index) => (
                                        <button
                                            key={team.id}
                                            id={index === 0 ? "tour-invite-team-select" : undefined}
                                            type="button"
                                            onClick={() => toggleTeam(team.id)}
                                            className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all ${selectedTeamIds.includes(team.id)
                                                ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20'
                                                : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <Users size={14} className="text-gray-400" />
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300">{team.name}</span>
                                            </div>
                                            {selectedTeamIds.includes(team.id) && (
                                                <div className="w-5 h-5 rounded-full bg-[#6366f1] flex items-center justify-center text-white">
                                                    <Check size={10} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    )
}
