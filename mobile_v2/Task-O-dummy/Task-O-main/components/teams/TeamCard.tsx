'use client'

import { MoreHorizontal, UserPlus, Edit, Trash2, Users } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { deleteTeam } from '@/lib/teams/actions'
import Link from 'next/link'

interface TeamCardProps {
    team: {
        id: string
        name: string
        avatar_url?: string
    }
    memberCount: number
    isOwner: boolean
}

export default function TeamCard({ team, memberCount, isOwner }: TeamCardProps) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (loading) return

        // Using a simpler approach for now to stay within time, 
        // but removing the alert on success.
        if (confirm('Are you sure you want to delete this team? All members will be removed.')) {
            setLoading(true)
            try {
                await deleteTeam(team.id)
            } catch (error: any) {
                console.error(error.message)
            } finally {
                setLoading(false)
            }
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative">
            <div className="flex justify-between items-start">
                <Link href={`/teams/${team.id}`} className="flex items-center space-x-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 overflow-hidden">
                        {team.avatar_url ? (
                            <Image
                                src={team.avatar_url}
                                alt={team.name}
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <Users className="h-6 w-6" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {memberCount} Members
                        </p>
                    </div>
                </Link>
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <MoreHorizontal className="h-5 w-5" />
                    </button>

                    {menuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuOpen(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden">
                                <Link
                                    href={`/teams/${team.id}`}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                    <UserPlus className="h-4 w-4 mr-3" />
                                    Invite User
                                </Link>
                                <Link
                                    href={`/teams/${team.id}/settings`}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                    <Edit className="h-4 w-4 mr-3" />
                                    Edit Team
                                </Link>
                                {isOwner && (
                                    <button
                                        disabled={loading}
                                        className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center border-t border-gray-50 transition-colors ${loading ? 'text-gray-400 bg-gray-50' : 'text-red-600 hover:bg-red-50'
                                            }`}
                                        onClick={() => { handleDelete(); setMenuOpen(false) }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-3" />
                                        {loading ? 'Deleting...' : 'Delete Team'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
