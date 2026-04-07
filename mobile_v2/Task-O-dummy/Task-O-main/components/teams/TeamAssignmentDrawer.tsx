'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Users, UserPlus, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { addTeamMember } from '@/lib/teams/actions'
import { useRouter } from 'next/navigation'

interface TeamAssignmentDrawerProps {
    teamId: string
    projectId: string
    existingMemberIds: string[]
    onClose: () => void
}

export default function TeamAssignmentDrawer({
    teamId,
    projectId,
    existingMemberIds,
    onClose
}: TeamAssignmentDrawerProps) {
    const router = useRouter()
    const [availableMembers, setAvailableMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        const fetchAvailable = async () => {
            // Fetch all project members
            const { data: projectMembers } = await supabase
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

            if (projectMembers) {
                // Filter out those already in the team
                const available = projectMembers
                    .map((m: any) => m.user)
                    .filter((u: any) => !existingMemberIds.includes(u.id))

                setAvailableMembers(available)
            }
            setLoading(false)
        }
        fetchAvailable()
    }, [projectId, existingMemberIds])

    const handleAssign = async (userId: string) => {
        setProcessingId(userId)
        try {
            await addTeamMember(teamId, userId)
            setAvailableMembers(prev => prev.filter(u => u.id !== userId))
            router.refresh()
        } catch (error) {
            console.error('Failed to assign member:', error)
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h3 className="text-[10px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-widest flex items-center gap-2">
                    <Users size={12} className="text-[#6366f1]" />
                    Available Personnel
                </h3>
                <p className="text-[10px] text-gray-400 font-medium italic">Assign existing project members to this specialized unit.</p>
            </div>

            {loading ? (
                <div className="py-12 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanning workforce...</div>
            ) : availableMembers.length === 0 ? (
                <div className="py-20 text-center bg-gray-50/50 dark:bg-slate-800/20 rounded-[32px] border border-dashed border-gray-100 dark:border-slate-800/50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">All project members assigned</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {availableMembers.map((user, index) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/50 rounded-2xl group hover:border-[#6366f1]/20 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-[10px] text-gray-400 font-black border border-gray-100 dark:border-slate-800 overflow-hidden">
                                    {user.avatar_url ? (
                                        <Image
                                            src={user.avatar_url}
                                            alt={user.full_name || 'User avatar'}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        user.full_name?.[0] || 'U'
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[12px] font-black text-gray-900 dark:text-slate-100">{user.full_name || 'Anonymous'}</span>
                                    <span className="text-[9px] text-gray-400 dark:text-slate-500 truncate max-w-[120px]">{user.email}</span>
                                </div>
                            </div>
                            <button
                                id={index === 0 ? "tour-assign-member-btn" : undefined}
                                onClick={() => handleAssign(user.id)}
                                disabled={!!processingId}
                                className="p-2 text-gray-300 hover:text-[#6366f1] hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                            >
                                {processingId === user.id ? (
                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <UserPlus size={16} />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-8 border-t border-gray-50 dark:border-slate-800/50">
                <button
                    onClick={onClose}
                    className="w-full py-4 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 text-[10px] font-black text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 uppercase tracking-widest rounded-2xl transition-all"
                >
                    Return to Unit Dashboard
                </button>
            </div>
        </div>
    )
}
