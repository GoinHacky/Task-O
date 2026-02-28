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
        <div className="flex flex-col gap-1.5">
            <h1 className="text-[32px] font-black text-gray-900 dark:text-slate-50 tracking-tightest leading-none uppercase flex items-center flex-wrap">
                <span>{projectName}</span>
                <span className="text-gray-200 dark:text-slate-800 mx-3 font-light">/</span>
                <span className="text-gray-900 dark:text-slate-50 font-black">{sectionName}</span>
            </h1>
            <div className="flex items-center gap-3">
                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] italic">
                    {projectDescription?.substring(0, 100) || 'STRATEGIC OPERATIONS ARCHITECTURE'}
                </p>
            </div>
        </div>
    )
}
