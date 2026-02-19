'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import KanbanBoard from '@/components/KanbanBoard'
import EditTaskModal from '@/components/projects/EditTaskModal'
import CreateTaskModal from '@/components/projects/CreateTaskModal'
import { Plus, Search, Filter } from 'lucide-react'

interface ProjectKanbanClientProps {
    projectId: string
}

interface Team {
    id: string
    name: string
}

export default function ProjectKanbanClient({ projectId }: ProjectKanbanClientProps) {
    const [user, setUser] = useState<any>(null)
    const [teams, setTeams] = useState<any[]>([])
    const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined)
    const [canManage, setCanManage] = useState(false)
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTask, setSelectedTask] = useState<any | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            const { data: teamsData } = await supabase
                .from('teams')
                .select('id, name')
                .eq('project_id', projectId)

            setTeams(teamsData || [])

            if (user) {
                const { data: membership } = await supabase
                    .from('project_members')
                    .select('role')
                    .eq('project_id', projectId)
                    .eq('user_id', user.id)
                    .single()

                setCanManage(membership?.role === 'admin' || membership?.role === 'manager' || membership?.role === 'owner')
            }

            fetchTasks()
        }
        fetchInitialData()
    }, [projectId])

    const fetchTasks = async () => {
        setLoading(true)
        let query = supabase
            .from('tasks')
            .select(`
                *,
                assignee:assigned_to (
                    id,
                    full_name,
                    email,
                    avatar_url
                )
            `)
            .eq('project_id', projectId)

        if (selectedTeam) {
            query = query.eq('team_id', selectedTeam)
        }

        const { data } = await query.order('created_at', { ascending: false })
        setTasks(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchTasks()
    }, [selectedTeam])

    return (
        <div className="space-y-10 pb-32">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div className="flex items-center gap-4">
                    <select
                        value={selectedTeam || ''}
                        onChange={(e) => setSelectedTeam(e.target.value || undefined)}
                        className="pl-4 pr-10 py-2.5 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-[#6366f1]/10 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Regions</option>
                        {teams.map((team: Team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 border border-gray-100 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-900 transition-all">
                        <Filter size={14} /> View Opts
                    </button>
                    {canManage && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-2.5 bg-[#6366f1] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5558e3] transition-all flex items-center gap-2 shadow-lg shadow-[#6366f1]/20 active:scale-95"
                        >
                            <Plus size={16} /> New Task
                        </button>
                    )}
                </div>
            </div>

            {/* Interactive Timeline View */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-4">
                        <div className="w-8 h-8 border-4 border-[#6366f1]/20 border-t-[#6366f1] rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gathering Intel...</p>
                    </div>
                ) : (
                    <KanbanBoard
                        projectId={projectId}
                        teamId={selectedTeam}
                        tasks={tasks}
                        canManage={canManage}
                    />
                )}
            </div>

            {/* Modals */}
            {selectedTask && (
                <EditTaskModal
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    task={selectedTask}
                    onUpdate={fetchTasks}
                />
            )}

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                initialProjectId={projectId}
                initialTeamId={selectedTeam}
                onSuccess={fetchTasks}
            />
        </div>
    )
}

