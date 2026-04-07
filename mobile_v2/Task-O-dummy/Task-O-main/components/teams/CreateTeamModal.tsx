'use client'

import { Users, Layout, ChevronDown, AlertCircle, User as UserIcon, Check, Plus } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { createTeam } from '@/lib/teams/actions'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { useGuidedTour } from '@/components/GuidedTour'

interface CreateTeamModalProps {
    isOpen: boolean
    onClose: () => void
    initialProjectId?: string
    onSuccess?: () => void
}

export default function CreateTeamModal({ isOpen, onClose, initialProjectId, onSuccess }: CreateTeamModalProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [projectId, setProjectId] = useState(initialProjectId || '')
    const [leadId, setLeadId] = useState('')
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
    const [invitationEmails, setInvitationEmails] = useState('')
    const [memberLoading, setMemberLoading] = useState(false)
    const { nextStep, endTour, isActive, startTour } = useGuidedTour()

    const [projects, setProjects] = useState<any[]>([])
    const [allMembers, setAllMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isFetchingInitial, setIsFetchingInitial] = useState(true)

    const fetchInitialData = useCallback(async () => {
        setIsFetchingInitial(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch Projects where user is admin or owner
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
        const fetchProjectMembers = async () => {
            if (!projectId) {
                setAllMembers([])
                return
            }

            setMemberLoading(true)
            const { data } = await supabase
                .from('project_members')
                .select(`
                    user:user_id (
                        id,
                        full_name,
                        email,
                        avatar_url
                    )
                `)
                .eq('project_id', projectId)
                .eq('status', 'accepted')

            const memberList = data?.map((m: any) => m.user).filter(Boolean) || []
            setAllMembers(memberList)
            setMemberLoading(false)
        }

        if (isOpen) {
            fetchProjectMembers()
        }
    }, [isOpen, projectId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const emailList = invitationEmails.split(/[\s,x]+/).map(e => e.trim()).filter(e => e.includes('@'))
            await createTeam(
                name,
                description,
                projectId || undefined,
                leadId || undefined,
                selectedMemberIds,
                emailList
            )
            onClose()
            resetForm()
            if (isActive) nextStep()
            if (onSuccess) onSuccess()
        } catch (error: any) {
            setError(error.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setName('')
        setDescription('')
        setProjectId(initialProjectId || '')
        setLeadId('')
        setSelectedMemberIds([])
        setInvitationEmails('')
    }

    const toggleMember = (userId: string) => {
        if (userId === leadId) return
        setSelectedMemberIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    useEffect(() => {
        if (leadId) {
            setSelectedMemberIds(prev => prev.filter(id => id !== leadId))
        }
    }, [leadId])

    const noProjects = !isFetchingInitial && projects.length === 0

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose()
                if (isActive) endTour()
            }}
            title="Create Team"
            helperText="Group members by function"
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
                            id="tour-create-team-submit"
                            onClick={handleSubmit}
                            disabled={loading || !name}
                            className="flex-1 py-4 text-[10px] font-black text-[#6366f1] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    )}
                </>
            }
        >
            <div className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-600 animate-in slide-in-from-top-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{error}</span>
                    </div>
                )}

                {noProjects ? (
                    <div className="py-12 px-6 text-center animate-in fade-in zoom-in duration-500 bg-gray-50/50 dark:bg-slate-900/50 rounded-[32px] border border-dashed border-gray-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/5">
                            <Layout size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">No Projects Found</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 leading-relaxed">
                            You need a project to house your team. Create one first to get started.
                        </p>
                        <Link
                            id="tour-team-no-projects-link"
                            href="/projects"
                            onClick={() => {
                                onClose()
                                startTour('create-project')
                            }}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-[#6366f1] text-white text-[10px] font-black rounded-xl hover:bg-[#5558e3] transition-all shadow-lg shadow-indigo-500/20 active:scale-95 uppercase tracking-[0.2em]"
                        >
                            <Plus size={14} strokeWidth={2.5} /> Create My First Project
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Team Name *</label>
                            <input
                                id="tour-team-name-input"
                                autoFocus
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-100 placeholder:font-medium"
                                placeholder="e.g. Design Engine"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Parent Project</label>
                            <div className="relative group">
                                <select
                                    id="tour-team-parent-project"
                                    required
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-100 appearance-none"
                                >
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Team Lead</label>
                            <div className="relative group">
                                <select
                                    id="tour-team-lead"
                                    value={leadId}
                                    onChange={(e) => setLeadId(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-100 appearance-none"
                                >
                                    <option value="">Select a member...</option>
                                    {allMembers.map(m => (
                                        <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {allMembers.length > 0 && (
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Members</label>
                                <div className="max-h-32 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                                    {allMembers.filter(m => m.id !== leadId).map(member => (
                                        <button
                                            key={member.id}
                                            type="button"
                                            onClick={() => toggleMember(member.id)}
                                            className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all ${selectedMemberIds.includes(member.id)
                                                ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20'
                                                : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                                    {member.avatar_url ? (
                                                        <Image
                                                            src={member.avatar_url}
                                                            alt={member.full_name || 'Member'}
                                                            width={32}
                                                            height={32}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <UserIcon size={14} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300">{member.full_name || member.email}</span>
                                            </div>
                                            {selectedMemberIds.includes(member.id) && (
                                                <div className="w-5 h-5 rounded-full bg-[#6366f1] flex items-center justify-center text-white">
                                                    <Check size={10} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Team Description</label>
                            <textarea
                                id="tour-team-description-input"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-600 dark:text-slate-400 h-24 resize-none"
                                placeholder="Core mission and responsibilities..."
                            />
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    )
}
