'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { respondToProjectInvitation } from '@/lib/projects/actions'
import { useRouter } from 'next/navigation'

export default function InvitationActions({ projectId }: { projectId: string }) {
    const router = useRouter()
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

    const handleAction = async (accept: boolean) => {
        setStatus('loading')
        try {
            await respondToProjectInvitation(projectId, accept)
            setStatus('success')
            router.refresh()
        } catch (error) {
            console.error(error)
            setStatus('idle')
        }
    }

    if (status === 'success') {
        return (
            <div className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-4">
                Invitation Processed
            </div>
        )
    }

    return (
        <div className="flex items-center gap-3 mt-4">
            <button
                disabled={status === 'loading'}
                onClick={() => handleAction(true)}
                className="px-4 py-2 bg-[#6366f1] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#5558e3] transition-all flex items-center gap-2 shadow-lg shadow-[#6366f1]/20 disabled:opacity-50"
            >
                <Check size={14} /> Accept
            </button>
            <button
                disabled={status === 'loading'}
                onClick={() => handleAction(false)}
                className="px-4 py-2 bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2 border border-gray-100 dark:border-slate-800/50 disabled:opacity-50"
            >
                <X size={14} /> Decline
            </button>
        </div>
    )
}
