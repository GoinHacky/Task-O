'use client'

import { usePathname } from 'next/navigation'

interface ProjectHeaderProps {
    projectName: string
    projectDescription?: string | null
}

export default function ProjectHeader({ projectName, projectDescription }: ProjectHeaderProps) {
    const pathname = usePathname()

    // Determine section name based on pathname
    const getSectionName = () => {
        const segments = pathname.split('/')
        const lastSegment = segments[segments.length - 1]

        // If the last segment is the ID, it's the overview page
        if (lastSegment.match(/^[0-9a-f-]{36}$/) || lastSegment === '[id]') {
            return 'Project Overview'
        }

        switch (lastSegment) {
            case 'kanban': return 'Project Boards'
            case 'tasks': return 'Project Tasks'
            case 'teams': return 'Project Teams'
            case 'members': return 'Project Members'
            case 'reports': return 'Project Reports'
            case 'settings': return 'Project Settings'
            default: return 'Project Overview'
        }
    }

    const sectionName = getSectionName()

    return (
        <div className="flex flex-col">
            <h1 className="text-2xl md:text-[32px] font-black tracking-tightest leading-none uppercase max-w-7xl flex flex-col gap-1 md:gap-2 transition-all duration-300">
                <span className="text-gray-900 dark:text-slate-50 flex items-center">
                    {projectName} <span className="text-gray-200 dark:text-slate-800 font-light ml-3 opacity-50">/</span>
                </span>
                <span className="text-gray-900 dark:text-slate-50">{sectionName}</span>
            </h1>
            <div className="mt-2 md:mt-3">
                <p className="text-[9px] md:text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.3em] md:tracking-[0.4em] leading-relaxed max-w-3xl">
                    {projectDescription || 'STRATEGIC OPERATIONS ARCHITECTURE'}
                </p>
            </div>
        </div>
    )
}
