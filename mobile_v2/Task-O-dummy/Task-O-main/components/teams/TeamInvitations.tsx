'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { respondToInvitation } from '@/lib/teams/actions'
import { Mail, Check, X, Users } from 'lucide-react'

export default function TeamInvitations() {
    const [invitations, setInvitations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchInvitations = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('team_invitations')
                .select(`
          *,
          teams (
            name,
            owner_id
          )
        `)
                .eq('email', user.email)
                .eq('status', 'pending')

            if (data) setInvitations(data)
        } catch (error) {
            console.error('Error fetching invitations:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInvitations()
    }, [])

    const handleResponse = async (id: string, status: 'accepted' | 'rejected') => {
        try {
            await respondToInvitation(id, status)
            setInvitations(prev => prev.filter(i => i.id !== id))
        } catch (error: any) {
            alert(error.message)
        }
    }

    if (loading || invitations.length === 0) return null

    return (
        <div className="mb-8 p-6 bg-primary-50 border border-primary-100 rounded-xl shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
                <Mail className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-bold text-gray-900">Team Invitations</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invitations.map((invite) => (
                    <div key={invite.id} className="bg-white p-4 rounded-lg flex items-center justify-between shadow-sm">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {invite.teams?.name || 'Unknown Team'}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">Role: {invite.role}</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleResponse(invite.id, 'accepted')}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                title="Accept"
                            >
                                <Check className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleResponse(invite.id, 'rejected')}
                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                title="Decline"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
