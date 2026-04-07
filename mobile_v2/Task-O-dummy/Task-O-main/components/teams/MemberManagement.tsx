'use client'

import { removeMember, updateMemberRole } from '@/lib/teams/actions'
import { MoreVertical, Trash2, UserCog } from 'lucide-react'
import { useState } from 'react'

interface MemberManagementProps {
    member: {
        user_id: string
        role: 'owner' | 'admin' | 'editor' | 'member' | 'viewer'
        team_id: string
    }
    currentUserRole: 'owner' | 'admin' | 'editor' | 'member' | 'viewer'
    isCurrentUser: boolean
}

export default function MemberManagement({ member, currentUserRole, isCurrentUser }: MemberManagementProps) {
    const [isOpen, setIsOpen] = useState(false)

    const canManage = !isCurrentUser && (
        (currentUserRole === 'owner') ||
        (currentUserRole === 'admin' && member.role === 'member')
    )

    if (!canManage) return (
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
            {member.role}
        </span>
    )

    const handleRemove = async () => {
        if (confirm('Are you sure you want to remove this member?')) {
            try {
                await removeMember(member.team_id, member.user_id)
            } catch (error: any) {
                alert(error.message)
            }
        }
    }

    const handleRoleChange = async (newRole: 'admin' | 'editor' | 'member' | 'viewer') => {
        try {
            await updateMemberRole(member.team_id, member.user_id, newRole)
            setIsOpen(false)
        } catch (error: any) {
            alert(error.message)
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 text-xs font-semibold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-1 rounded hover:bg-primary-100 transition-colors"
            >
                <span>{member.role}</span>
                <MoreVertical className="h-3 w-3" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden">
                        {currentUserRole === 'owner' && (
                            <div className="py-1">
                                {(['admin', 'editor', 'member', 'viewer'] as const).map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => handleRoleChange(role)}
                                        className={`w-full text-left px-4 py-2 text-sm flex items-center ${member.role === role ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        <UserCog className="h-4 w-4 mr-3" />
                                        Make {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </button>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={handleRemove}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center border-t border-gray-50"
                        >
                            <Trash2 className="h-4 w-4 mr-3" />
                            Remove Member
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
