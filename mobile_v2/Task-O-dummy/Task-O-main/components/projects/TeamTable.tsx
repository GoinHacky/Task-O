'use client'

import { Users, LayoutDashboard, MoreHorizontal, ChevronRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { deleteTeam } from '@/lib/teams/actions'
import DeleteTeamModal from '@/components/teams/DeleteTeamModal'

interface TeamTableProps {
    teams: any[]
    projectId: string
    currentUserId: string
    isAdmin: boolean
}

export default function TeamTable({ teams, projectId, currentUserId, isAdmin }: TeamTableProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [teamToDelete, setTeamToDelete] = useState<any>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDeleteClick = (team: any) => {
        setTeamToDelete(team)
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!teamToDelete) return
        setIsDeleting(true)
        try {
            await deleteTeam(teamToDelete.id)
            setIsDeleteModalOpen(false)
            setTeamToDelete(null)
        } catch (error) {
            console.error('Failed to delete team:', error)
            alert('Failed to delete team')
        } finally {
            setIsDeleting(false)
        }
    }
    return (
        <div className="w-full overflow-x-auto scrollbar-hide">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-gray-50 dark:border-slate-800/50">
                        <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-[0.2em]">Specialized Unit</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-[0.2em]">Personnel</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-[0.2em]">Workload</th>
                        <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-[0.2em]"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/20">
                    {teams.map((team, index) => (
                        <tr
                            key={team.id}
                            className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-all"
                        >
                            <td className="px-6 py-5">
                                <Link href={`/projects/${projectId}/teams/${team.id}`} className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[18px] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-center text-[#6366f1] group-hover:scale-105 transition-transform group-hover:border-[#6366f1]/20">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-black text-gray-900 dark:text-slate-50 group-hover:text-[#6366f1] transition-colors uppercase tracking-tightest leading-none mb-1">{team.name}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest truncate max-w-[200px]">{team.description || 'General Responsibility Center'}</p>
                                    </div>
                                </Link>
                            </td>
                            <td className="px-6 py-5">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest">{team.members?.[0]?.count || 0} Core Staff</span>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Active Assignment</span>
                                </div>
                            </td>
                            <td className="px-6 py-5 min-w-[200px]">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Execution Density</span>
                                        <span className="text-[10px] font-black text-gray-900 dark:text-slate-100 italic">{(team.tasks?.[0]?.count || 0) * 8}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${(team.tasks?.[0]?.count || 0) > 5 ? 'bg-orange-500' : 'bg-[#6366f1]'}`}
                                            style={{ width: `${Math.min(100, (team.tasks?.[0]?.count || 0) * 8)}%` }}
                                        />
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                                <Link
                                    id={index === 0 ? "tour-review-unit-btn" : undefined}
                                    href={`/projects/${projectId}/teams/${team.id}`}
                                    className="px-6 py-2.5 bg-gray-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-gray-100 dark:hover:border-slate-700 rounded-xl text-[10px] font-black text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 uppercase tracking-widest transition-all"
                                >
                                    Review Unit
                                </Link>
                                {(isAdmin || team.owner_id === currentUserId) && (
                                    <button
                                        onClick={() => handleDeleteClick(team)}
                                        className="p-2.5 bg-rose-50/50 dark:bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all active:scale-95 border border-rose-100 dark:border-rose-500/20"
                                        title="Delete Team"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {teams.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-2 opacity-30">
                                    <Users size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No specialized units defined</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {teamToDelete && (
                <DeleteTeamModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    teamName={teamToDelete.name}
                    loading={isDeleting}
                />
            )}
        </div>
    )
}
