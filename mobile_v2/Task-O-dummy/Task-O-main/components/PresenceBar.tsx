'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

interface PresenceUser {
    user_id: string
    full_name: string
    avatar_url?: string
    last_seen: string
}

export default function PresenceBar({ projectId, currentUser }: { projectId: string, currentUser: any }) {
    const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([])

    useEffect(() => {
        if (!projectId || !currentUser) return

        const channel = supabase.channel(`project_presence:${projectId}`, {
            config: {
                presence: {
                    key: currentUser.id,
                },
            },
        })

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState()
                const users: PresenceUser[] = []

                for (const key in newState) {
                    const presence = newState[key] as any
                    if (presence && presence[0]) {
                        users.push({
                            user_id: key,
                            full_name: presence[0].full_name || 'Anonymous',
                            avatar_url: presence[0].avatar_url,
                            last_seen: new Date().toISOString()
                        })
                    }
                }
                // Filter out current user if you only want to see others, 
                // but usually it's better to show everyone.
                setActiveUsers(users)
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('User joined:', key, newPresences)
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('User left:', key, leftPresences)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        full_name: currentUser.user_metadata?.full_name || currentUser.email,
                        avatar_url: currentUser.user_metadata?.avatar_url,
                        online_at: new Date().toISOString(),
                    })
                }
            })

        return () => {
            channel.unsubscribe()
        }
    }, [projectId, currentUser])

    if (activeUsers.length <= 1) return null // Only show if more than just the current user

    return (
        <div className="flex items-center -space-x-2 overflow-hidden px-4 py-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-full border border-gray-100 dark:border-slate-800 shadow-sm transition-all animate-in fade-in slide-in-from-right-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mr-4 ml-1">Live Now:</span>
            {activeUsers.slice(0, 5).map((user) => (
                <div key={user.user_id} className="relative group">
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-600 dark:text-indigo-400 overflow-hidden shadow-sm transition-transform hover:scale-110 hover:z-10 cursor-pointer">
                        {user.avatar_url ? (
                            <Image
                                src={user.avatar_url}
                                alt={user.full_name}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            user.full_name[0]
                        )}
                    </div>
                    {/* Simple tooltip fallback if Tooltip component is missing/complex */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        {user.full_name} {user.user_id === currentUser.id ? '(You)' : ''}
                    </div>
                </div>
            ))}
            {activeUsers.length > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-gray-400">
                    +{activeUsers.length - 5}
                </div>
            )}
        </div>
    )
}
