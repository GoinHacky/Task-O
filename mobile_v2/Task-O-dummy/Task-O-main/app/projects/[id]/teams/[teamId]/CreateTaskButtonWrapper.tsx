'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateTaskModal from '@/components/projects/CreateTaskModal'

export default function CreateTaskButtonWrapper({ projectId, teamId }: { projectId: string, teamId?: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#6366f1] text-white rounded-2xl hover:bg-[#5558e3] transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#6366f1]/20 active:scale-95"
            >
                <Plus size={18} />
                Create Task
            </button>

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialProjectId={projectId}
                initialTeamId={teamId}
            />
        </>
    )
}
