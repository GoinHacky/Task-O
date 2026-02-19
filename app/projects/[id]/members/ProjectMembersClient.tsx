'use client'

import { useState } from 'react'
import { Search, Filter, Shield, MoreHorizontal, UserPlus, Users, LayoutDashboard } from 'lucide-react'
import InviteMemberModal from '@/components/InviteMemberModal'
import Modal from '@/components/ui/Modal'
import MemberDetailDrawer from '@/components/projects/MemberDetailDrawer'

interface ProjectMembersClientProps {
    projectId: string
    members: any[]
    isAdmin: boolean
    currentUserId: string
    ownerId: string
}

export default function ProjectMembersClient({
    projectId,
    members,
    isAdmin,
    currentUserId,
    ownerId
}: ProjectMembersClientProps) {
    const [selectedMember, setSelectedMember] = useState<any | null>(null)
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all')

    const filteredMembers = members.filter(m => {
        if (!searchQuery) {
            const matchesRole = roleFilter === 'all' || m.role === roleFilter
            return matchesRole
        }

        const search = searchQuery.toLowerCase()
        const matchesSearch = m.user?.full_name?.toLowerCase().includes(search) ||
            m.user?.email?.toLowerCase().includes(search) ||
            (m.status === 'pending' && !m.user)
        const matchesRole = roleFilter === 'all' || m.role === roleFilter
        return matchesSearch && matchesRole
    })

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-32">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[20px] font-black text-gray-900 dark:text-slate-50 tracking-tightest uppercase">Personnel Hub</h2>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1 italic">Answer: Who has access and roles?</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsInviteOpen(true)}
                        className="inline-flex items-center px-6 py-2.5 bg-[#6366f1] text-white rounded-xl font-medium hover:bg-[#5558e3] transition-all flex items-center gap-2 shadow-lg shadow-[#6366f1]/20 active:scale-95"
                    >
                        <UserPlus size={18} />
                        <span className="text-[11px] font-black uppercase tracking-widest">Invite Member</span>
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600 group-focus-within:text-[#6366f1] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900/40 border border-gray-100 dark:border-slate-800/50 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900/40 border border-gray-100 dark:border-slate-800/50 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
                    {(['all', 'admin', 'member'] as const).map(role => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === role ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/40 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm overflow-hidden backdrop-blur-xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-50 dark:border-slate-800/50 bg-gray-50/30 dark:bg-white/5">
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Name</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Role</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Teams</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Tasks</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-5 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800/20">
                        {filteredMembers?.length > 0 ? filteredMembers.map((member) => (
                            <tr
                                key={member.id}
                                onClick={() => setSelectedMember(member)}
                                className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-all cursor-pointer"
                            >
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform">
                                            {member.user?.avatar_url ? (
                                                <img src={member.user.avatar_url} alt={member.user.full_name || 'Member'} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-black text-[#6366f1] uppercase">{member.user?.full_name?.[0] || 'U'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-black text-gray-900 dark:text-slate-50 group-hover:text-[#6366f1] transition-colors">{member.user?.full_name || 'Anonymous User'}</p>
                                            <p className="text-[10px] font-medium text-gray-400">{member.user?.email || 'No email provided'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <Shield size={12} className={member.role === 'admin' ? 'text-indigo-500' : 'text-gray-300'} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${member.role === 'admin' ? 'text-indigo-500' : 'text-gray-500'}`}>
                                            {member.role}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center border border-gray-100 dark:border-slate-800">
                                            <Users size={10} className="text-gray-400" />
                                        </div>
                                        <span className="text-xs font-black text-gray-700 dark:text-slate-300">
                                            {member.user?.team_count?.[0]?.count || 0}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center border border-gray-100 dark:border-slate-800">
                                            <LayoutDashboard size={10} className="text-gray-400" />
                                        </div>
                                        <span className="text-xs font-black text-gray-700 dark:text-slate-300">
                                            {member.user?.task_count?.[0]?.count || 0}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${member.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' :
                                        member.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' :
                                            'bg-gray-50 text-gray-400 dark:bg-slate-800'
                                        }`}>
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button className="p-2.5 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 text-gray-400 hover:text-[#6366f1] hover:bg-[#f3f4ff] dark:hover:bg-indigo-500/10 transition-all">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <Users size={40} className="text-gray-300 mb-4" />
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">No personnel found</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Member Detail Modal */}
            <Modal
                isOpen={!!selectedMember}
                onClose={() => setSelectedMember(null)}
                title="Personnel Profile"
                helperText="Member specifics and access"
                footer={
                    <button
                        className="w-full py-4 bg-gray-50/50 dark:bg-slate-800/20 hover:bg-gray-50 dark:hover:bg-slate-800 text-[10px] font-black text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 uppercase tracking-widest transition-all"
                        onClick={() => setSelectedMember(null)}
                    >
                        Return to Personnel Hub
                    </button>
                }
            >
                {selectedMember && (
                    <MemberDetailDrawer
                        member={selectedMember}
                        projectId={projectId}
                        isAdmin={isAdmin}
                        currentUserId={currentUserId}
                        ownerId={ownerId}
                        onClose={() => setSelectedMember(null)}
                    />
                )}
            </Modal>

            <InviteMemberModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                projectId={projectId}
                onSuccess={() => {
                    // Refresh current view
                    window.location.reload()
                }}
            />
        </div >
    )
}
