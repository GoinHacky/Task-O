'use client'

import { useState } from 'react'
import { Plus, Users, UserPlus, Shield } from 'lucide-react'
import Drawer from '@/components/ui/Drawer'
import TeamAssignmentDrawer from '@/components/teams/TeamAssignmentDrawer'

interface TeamPersonnelClientProps {
    team: any
    projectId: string
    isAdmin: boolean
    tasks: any[]
}

export default function TeamPersonnelClient({ team, projectId, isAdmin, tasks }: TeamPersonnelClientProps) {
    const [isAssignmentOpen, setIsAssignmentOpen] = useState(false)
    const existingMemberIds = team.members.map((m: any) => m.user.id)

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
                                    {member.user.avatar_url ? (
                                        <img src={member.user.avatar_url} className="w-full h-full object-cover" alt={member.user.full_name} />
                                    ) : (
                                        member.user.full_name?.[0] || 'U'
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 dark:text-slate-100">{member.user.full_name}</p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] font-black text-gray-400 capitalize flex items-center gap-1">
                                            <Shield size={10} className={member.role === 'admin' ? 'text-indigo-500' : 'text-gray-300'} />
                                            {member.role}
                                        </p>
                                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                            {tasks.filter(t => t.assigned_to === member.user.id && (t.status === 'in_progress' || t.status === 'review')).length} Active
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-900 dark:text-slate-100">
                                    {Math.round((tasks.filter(t => t.assigned_to === member.user.id && t.status === 'completed').length /
                                        Math.max(tasks.filter(t => t.assigned_to === member.user.id).length, 1)) * 100)}%
                                </p>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-tightest">Efficiency</p>
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
