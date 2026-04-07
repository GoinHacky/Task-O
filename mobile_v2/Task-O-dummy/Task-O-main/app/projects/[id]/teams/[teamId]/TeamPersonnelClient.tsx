'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, UserPlus, Shield, MoreVertical, UserMinus } from 'lucide-react'
import Image from 'next/image'
import Drawer from '@/components/ui/Drawer'
import TeamAssignmentDrawer from '@/components/teams/TeamAssignmentDrawer'
import { updateMemberRole, removeMember } from '@/lib/teams/actions'
import { useRouter } from 'next/navigation'

interface TeamPersonnelClientProps {
    team: any
    projectId: string
    isAdmin: boolean
    isOwner: boolean
    tasks: any[]
}

export default function TeamPersonnelClient({ team, projectId, isAdmin, isOwner, tasks }: TeamPersonnelClientProps) {
    const router = useRouter()
    const [isAssignmentOpen, setIsAssignmentOpen] = useState(false)
    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const existingMemberIds = team.members.map((m: any) => m.user.id)
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            // Close if click is outside .actions-menu
            if (openMenuId && !target.closest('.actions-menu')) {
                setOpenMenuId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [openMenuId])

    const handleRoleChange = async (memberId: string, userId: string, newRole: 'admin' | 'member') => {
        setIsUpdating(memberId)
        try {
            await updateMemberRole(team.id, userId, newRole)
            router.refresh()
        } catch (error) {
            console.error('Failed to update role:', error)
        } finally {
            setIsUpdating(null)
        }
    }

    const handleRemoveMember = async (memberId: string, userId: string) => {
        if (!confirm('Are you sure you want to remove this member from the team?')) return
        setIsUpdating(memberId)
        try {
            await removeMember(team.id, userId)
            router.refresh()
        } catch (error) {
            console.error('Failed to remove member:', error)
        } finally {
            setIsUpdating(null)
        }
    }

    return (
        <section className="space-y-8">
            <div className="px-2 flex items-center justify-between">
                <h2 className="text-[16px] font-black text-gray-900 dark:text-slate-50 tracking-tightest uppercase">Personnel</h2>
                {isAdmin && (
                    <button
                        onClick={() => setIsAssignmentOpen(true)}
                        className="p-2 text-gray-400 hover:text-[#6366f1] hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                    >
                        <UserPlus size={18} />
                    </button>
                )}
            </div>
            <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
                <div className="space-y-6">
                    {team.members.map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 font-black group-hover:scale-105 transition-transform overflow-hidden border border-gray-100 dark:border-slate-800/50">
                                    {member.user?.avatar_url ? (
                                        <Image
                                            src={member.user.avatar_url}
                                            alt={member.user.full_name || 'Personnel avatar'}
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        member.user?.full_name?.[0] || 'U'
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 dark:text-slate-100">{member.user?.full_name || 'Anonymous'}</p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] font-black text-gray-400 capitalize flex items-center gap-1">
                                            <Shield size={10} className={member.role === 'admin' ? 'text-indigo-500' : 'text-gray-300'} />
                                            {member.role}
                                        </p>
                                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                            {tasks.filter(t => t.assigned_to === member.user?.id && (t.status === 'in_progress' || t.status === 'review')).length} Active
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-900 dark:text-slate-100">
                                        {Math.round((tasks.filter(t => t.assigned_to === member.user.id && t.status === 'completed').length /
                                            Math.max(tasks.filter(t => t.assigned_to === member.user.id).length, 1)) * 100)}%
                                    </p>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tightest">Efficiency</p>
                                </div>
                                {((isOwner && member.role !== 'owner') || (isAdmin && member.role === 'member')) && (
                                    <div className="relative actions-menu">
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                                            className="p-1 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                                        >
                                            <MoreVertical size={14} />
                                        </button>
                                        {openMenuId === member.id && (
                                            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-lg py-1 z-20 animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-100 dark:divide-slate-800/10">
                                                {isOwner && (
                                                    <button
                                                        onClick={() => {
                                                            handleRoleChange(member.id, member.user.id, member.role === 'admin' ? 'member' : 'admin')
                                                            setOpenMenuId(null)
                                                        }}
                                                        disabled={isUpdating === member.id}
                                                        className="w-full px-3 py-2 text-left text-[10px] font-black text-gray-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors flex items-center gap-1.5"
                                                    >
                                                        {isUpdating === member.id ? (
                                                            <div className="w-2.5 h-2.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <Shield size={10} className="text-indigo-500" />
                                                        )}
                                                        {member.role === 'admin' ? 'Make Member' : 'Make Admin'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        handleRemoveMember(member.id, member.user.id)
                                                        setOpenMenuId(null)
                                                    }}
                                                    disabled={isUpdating === member.id}
                                                    className="w-full px-3 py-2 text-left text-[10px] font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
                                                >
                                                    {isUpdating === member.id ? (
                                                        <div className="w-2.5 h-2.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <UserMinus size={10} className="text-rose-500" />
                                                    )}
                                                    Remove Member
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {team.members.length === 0 && (
                        <div className="py-10 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No personnel assigned</p>
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div className="mt-8 pt-6 border-t border-gray-50 dark:border-slate-800/50">
                        <button
                            id="tour-deploy-personnel-btn"
                            onClick={() => setIsAssignmentOpen(true)}
                            className="w-full py-4 bg-gray-50 dark:bg-slate-800/50 hover:bg-[#6366f1]/5 text-[10px] font-black text-gray-400 hover:text-[#6366f1] uppercase tracking-widest rounded-2xl transition-all border border-transparent hover:border-[#6366f1]/20 shadow-sm flex items-center justify-center gap-2"
                        >
                            <Plus size={14} />
                            Deploy Personnel
                        </button>
                    </div>
                )}
            </div>

            <Drawer
                isOpen={isAssignmentOpen}
                onClose={() => setIsAssignmentOpen(false)}
                title="Unit Deployment"
            >
                <TeamAssignmentDrawer
                    teamId={team.id}
                    projectId={projectId}
                    existingMemberIds={existingMemberIds}
                    onClose={() => setIsAssignmentOpen(false)}
                />
            </Drawer>
        </section>
    )
}
