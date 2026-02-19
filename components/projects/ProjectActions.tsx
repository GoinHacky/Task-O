'use client'

import { useState } from 'react'
import { Plus, Layout, Users, Zap, UserPlus } from 'lucide-react'
import CreateTaskModal from './CreateTaskModal'
import CreateBoardModal from './CreateBoardModal'
import InviteMemberModal from '../InviteMemberModal'

interface ProjectActionsProps {
    projectId: string
    isAdmin?: boolean
}

export default function ProjectActions({ projectId, isAdmin = false }: ProjectActionsProps) {
    const [isTaskOpen, setIsTaskOpen] = useState(false)
    const [isBoardOpen, setIsBoardOpen] = useState(false)
    const [isInviteOpen, setIsInviteOpen] = useState(false)

    const actions = [
        {
            label: 'Add Member',
            icon: UserPlus,
            onClick: () => setIsInviteOpen(true),
            show: isAdmin,
            color: 'hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600'
        },
        {
            label: 'New Board',
            icon: Layout,
            onClick: () => setIsBoardOpen(true),
            show: isAdmin,
            color: 'hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600'
        },
        {
            label: 'New Task',
            icon: Plus,
            onClick: () => setIsTaskOpen(true),
            show: true,
            color: 'hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600'
        }
    ]

    return (
        <>
            <div className="grid grid-cols-1 gap-4">
                {actions.filter(a => a.show).map((action, idx) => (
                    <button
                        key={idx}
                        onClick={action.onClick}
                        className={`w-full py-4 bg-gray-50/80 dark:bg-slate-800/50 ${action.color} rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent shadow-sm hover:shadow-lg active:scale-95 flex items-center justify-center gap-3 group`}
                    >
                        <action.icon size={16} className="group-hover:scale-110 transition-transform" />
                        {action.label}
                    </button>
                ))}
            </div>

            <CreateTaskModal
                isOpen={isTaskOpen}
                onClose={() => setIsTaskOpen(false)}
                initialProjectId={projectId}
            />

            <CreateBoardModal
                isOpen={isBoardOpen}
                onClose={() => setIsBoardOpen(false)}
                projectId={projectId}
            />

            <InviteMemberModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                projectId={projectId}
            />
        </>
    )
}
