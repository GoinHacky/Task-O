'use client'
import {
    ClipboardList, CheckCircle2, AlertCircle, Layout, Hash, Users, FileText,
    Layers, Tag, Calendar, Clock, Paperclip, ChevronDown, X, Bold, Italic,
    List, Link as LinkIcon, Type, Shield, Flag, Plus
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createTask } from '@/lib/tasks/actions'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase/client'
import { useGuidedTour } from '@/components/GuidedTour'

export default function CreateTaskModal({ isOpen, onClose, initialProjectId, initialTeamId, initialStatus, onSuccess }: { isOpen: boolean, onClose: () => void, initialProjectId?: string, initialTeamId?: string, initialStatus?: string, onSuccess?: () => void }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [projectId, setProjectId] = useState(initialProjectId || '')
    const [priority, setPriority] = useState('medium')
    const [dueDate, setDueDate] = useState('')
    const [dueTime, setDueTime] = useState('')
    const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId || '')
    const [isTeamAdmin, setIsTeamAdmin] = useState(false)
    const [projectOwnerId, setProjectOwnerId] = useState<string | null>(null)
    const [members, setMembers] = useState<any[]>([])
    const { nextStep, endTour, isActive, startTour } = useGuidedTour()
    const [userRole, setUserRole] = useState<string>('viewer')
    const [userTeams, setUserTeams] = useState<string[]>([])
    const [status, setStatus] = useState(initialStatus || 'pending')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isFetchingInitial, setIsFetchingInitial] = useState(true)

    const fetchContext = useCallback(async () => {
        setIsFetchingInitial(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Fetch user team memberships with roles and associated projects
        const { data: teamMemberships } = await supabase
            .from('team_members')
            .select(`
                role,
                team_id,
                teams (
                    project_id
                )
            `)
            .eq('user_id', user.id)

        const teamRoles = teamMemberships || []
        setUserTeams(teamRoles.map(t => t.team_id))

        // 2. Fetch projects: Include those user is a member of
        const { data: projectData } = await supabase
            .from('projects')
            .select(`
                id,
                name,
                owner_id,
                project_members(role, user_id)
            `)

        const projectList = projectData || []

        // 3. Filter projects where user has create permissions (Admin/Manager/Owner/Tech Lead)
        // either at project level or via team-level admin role
        const filteredProjects = projectList.filter(project => {
            // Is owner?
            if (project.owner_id === user.id) return true

            // Has project-level admin role?
            const projectMember = project.project_members?.find((m: any) => m.user_id === user.id)
            if (projectMember && ['admin', 'manager', 'tech_lead'].includes(projectMember.role)) return true

            // Has team-level admin role in this project?
            const hasTeamAdmin = teamRoles.some(tr =>
                (tr as any).teams?.project_id === project.id && ['admin', 'owner'].includes(tr.role)
            )
            return hasTeamAdmin
        })

        setProjects(filteredProjects)

        const currentProjectData = projectData?.find((p: any) => p.id === (projectId || initialProjectId))
        const myMemberRecord = currentProjectData?.project_members?.find((m: any) => m.user_id === user.id)
        const currentProjectRole = (myMemberRecord?.role) || 'viewer'
        setUserRole(currentProjectRole.toLowerCase())

        if (currentProjectData?.owner_id) {
            setProjectOwnerId(currentProjectData.owner_id)
        }

        if (filteredProjects.length > 0 && !projectId && !initialProjectId) {
            setProjectId(filteredProjects[0].id)
        }
        setIsFetchingInitial(false)
    }, [initialProjectId, projectId])

    useEffect(() => {
        if (isOpen) {
            fetchContext()
            if (initialStatus) {
                setStatus(initialStatus)
            }
        }
    }, [isOpen, fetchContext, initialStatus])

    const fetchData = useCallback(async () => {
        if (!projectId) {
            setMembers([])
            setTeams([])
            return
        }

        // Fetch Teams for project
        const { data: teamsData } = await supabase
            .from('teams')
            .select('*')
            .eq('project_id', projectId)

        setTeams(teamsData || [])

        // Fetch Members
        let query = supabase
            .from('project_members')
            .select(`
users: user_id(
    id,
    full_name,
    email,
    avatar_url
)
    `)
            .eq('project_id', projectId)

        let userIsTeamAdmin = false
        const { data: { user } } = await supabase.auth.getUser()

        // Team filtering logic: if a team is selected, only show members of that team
        if (selectedTeamId) {
            // Fetch team members for the selected team
            const { data: teamMembers } = await supabase
                .from('team_members')
                .select('user_id, role')
                .eq('team_id', selectedTeamId)

            const teamMemberIds = teamMembers?.map(tm => tm.user_id) || []
            query = query.in('user_id', teamMemberIds)

            if (user) {
                const userTeamMembership = teamMembers?.find(tm => tm.user_id === user.id)
                userIsTeamAdmin = userTeamMembership?.role === 'admin' || userTeamMembership?.role === 'owner'
            }
        }

        setIsTeamAdmin(userIsTeamAdmin)

        const { data: memberData } = await query

        const memberList = memberData?.map((m: any) => m.users).filter(Boolean) || []
        setMembers(memberList)

        // Auto-assign for member role
        if (userRole === 'member' && !userIsTeamAdmin) {
            if (user) setAssignedMemberIds([user.id])
        }
    }, [projectId, userRole, selectedTeamId])

    useEffect(() => {
        if (isOpen) {
            fetchData()
        }
    }, [isOpen, fetchData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const canCreate = ['admin', 'manager', 'owner', 'tech_lead'].includes(userRole) || isTeamAdmin
        if (!canCreate) {
            setError('You do not have permission to create tasks for this project/team.')
            return
        }
        if (!projectId) {
            setError('Selection of a Project is mandatory.')
            return
        }

        setLoading(true)
        setSuccess(false)
        setError(null)
        try {
            await createTask({
                title,
                description,
                project_id: projectId,
                team_id: selectedTeamId || undefined,
                priority,
                status,
                due_date: dueDate || undefined,
                due_time: dueTime || undefined,
                assigned_to: assignedMemberIds[0]
            })
            setSuccess(true)
            resetForm()
            if (isActive) nextStep()
            setTimeout(() => {
                setSuccess(false)
                onClose()
                if (onSuccess) onSuccess()
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Mission failed. Connection error.')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setPriority('medium')
        setStatus(initialStatus || 'pending')
        setDueDate('')
        setDueTime('')
        setAssignedMemberIds([])
    }

    const toggleMember = (id: string) => {
        setAssignedMemberIds(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        )
    }

    const noProjects = !isFetchingInitial && projects.length === 0
    const canCreate = ['admin', 'manager', 'owner', 'tech_lead'].includes(userRole) || isTeamAdmin

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose()
                if (isActive) endTour()
            }}
            title="New Task"
            helperText="Define task details and responsibility"
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
                            type="button"
                            id="tour-create-task-submit"
                            onClick={handleSubmit}
                            disabled={loading || !title || !projectId || !canCreate}
                            className="flex-1 py-4 text-[10px] font-black text-[#6366f1] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Executing...' : 'Create Task'}
                            {!canCreate && <span title="Permission required"><Shield size={12} className="text-amber-500" /></span>}
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
                    <h3 className="text-lg font-black text-gray-900 dark:text-slate-50 uppercase tracking-tight">Task Logged</h3>
                    <p className="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Task created successfully
                    </p>
                </div>
            ) : noProjects ? (
                <div className="py-12 px-6 text-center animate-in fade-in zoom-in duration-500 bg-gray-50/50 dark:bg-slate-900/50 rounded-[32px] border border-dashed border-gray-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/5 transition-transform hover:scale-110 duration-500">
                        <Layout size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">No Projects Found</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 leading-relaxed">
                        Missions require a project context. Create one first to begin tasking.
                    </p>
                    <Link
                        id="tour-task-no-projects-link"
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
                <div className="space-y-2">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-600 animate-in slide-in-from-top-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Title *</label>
                                <input
                                    id="tour-task-title-input"
                                    autoFocus
                                    required
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-100 placeholder:font-medium"
                                    placeholder="Task title..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Project</label>
                                <div className="relative group">
                                    <select
                                        id="tour-task-project-select"
                                        required
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                        className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-xs font-bold text-gray-900 dark:text-slate-100 appearance-none"
                                    >
                                        <option value="">Select Project...</option>
                                        {projects.map((p, index) => (
                                            <option key={`${p.id}-${index}`} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Team</label>
                                <div className="relative group">
                                    <select
                                        id="tour-task-team-select"
                                        value={selectedTeamId}
                                        onChange={(e) => setSelectedTeamId(e.target.value)}
                                        disabled={userRole === 'tech_lead' && userTeams.length === 1}
                                        className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-xs font-bold text-gray-900 dark:text-slate-100 appearance-none disabled:opacity-50"
                                    >
                                        <option value="">Select Team...</option>
                                        {teams.filter(t => {
                                            if (userRole === 'tech_lead') return userTeams.includes(t.id)
                                            return true
                                        }).map((t, index) => (
                                            <option key={`${t.id}-${index}`} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Assignee *</label>
                                <div className="relative group">
                                    <select
                                        id="tour-task-assignee-select"
                                        required
                                        value={assignedMemberIds[0] || ''}
                                        onChange={(e) => setAssignedMemberIds(e.target.value ? [e.target.value] : [])}
                                        disabled={userRole === 'member' && !isTeamAdmin}
                                        className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-100 appearance-none disabled:opacity-50"
                                    >
                                        <option value="">Select a member...</option>
                                        {members.filter(m => !(userRole === 'member' && isTeamAdmin && m.id === projectOwnerId)).map((m, index) => (
                                            <option key={`${m.id}-${index}`} value={m.id}>{m.full_name || m.email}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Status</label>
                                <div className="relative group">
                                    <select
                                        id="tour-task-status-select"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-xs font-bold text-gray-900 dark:text-slate-100 appearance-none"
                                    >
                                        <option value="pending">To Do</option>
                                        <option value="in_progress">Doing</option>
                                        <option value="completed">Done</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Priority</label>
                                <div className="relative group">
                                    <select
                                        id="tour-task-priority-select"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-xs font-bold text-gray-900 dark:text-slate-100 appearance-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Due Date</label>
                                <input
                                    id="tour-task-due-date"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-xs font-bold text-gray-900 dark:text-slate-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Due Time</label>
                                <input
                                    id="tour-task-due-time"
                                    type="time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-xs font-bold text-gray-900 dark:text-slate-100"
                                />
                            </div>
                        </div>




                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description</label>
                            <textarea
                                id="tour-task-description-input"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-[13px] font-bold text-gray-600 dark:text-slate-400 h-20 resize-none placeholder:font-medium"
                                placeholder="Operational details regarding the objective..."
                            />
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    )
}
