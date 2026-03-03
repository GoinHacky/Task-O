'use client'

import { Users } from 'lucide-react'
import { useState } from 'react'
import CreateTeamModal from './CreateTeamModal'

export default function CreateTeamButton({ initialProjectId }: { initialProjectId?: string }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all font-bold text-xs uppercase tracking-widest shadow-sm shadow-indigo-100/10 active:scale-95"
            >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 mr-1">
                    <Users size={18} />
                </div>
                Create Team
            </button>

            <CreateTeamModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                initialProjectId={initialProjectId}
            />
        </>
    )
}
