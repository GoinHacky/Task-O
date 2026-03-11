'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    FolderKanban,
    ClipboardList,
    Users,
    UserPlus,
    BarChart3,
    Settings,
    Calendar
} from 'lucide-react'

interface ProjectNavProps {
    projectId: string
    role: string
}

export default function ProjectNav({ projectId, role }: ProjectNavProps) {
    const pathname = usePathname()

    const tabs = [
        { href: `/projects/${projectId}`, icon: Home, label: 'Overview' },
        { href: `/projects/${projectId}/tasks`, icon: ClipboardList, label: 'Tasks' },
        { href: `/projects/${projectId}/teams`, icon: Users, label: 'Teams' },
        { href: `/projects/${projectId}/members`, icon: UserPlus, label: 'Members', roles: ['admin', 'manager', 'owner'] },
        { href: `/projects/${projectId}/reports`, icon: BarChart3, label: 'Reports', roles: ['admin', 'manager', 'owner'] },
        { href: `/projects/${projectId}/settings`, icon: Settings, label: 'Settings', roles: ['admin', 'owner'] },
    ]

    return (
        <nav className="flex items-center gap-1.5 p-1 bg-gray-50/50 dark:bg-slate-900/50 rounded-[18px] border border-gray-300 dark:border-slate-800 backdrop-blur-sm">
            {tabs.map((tab) => {
                if (tab.roles && !tab.roles.includes(role)) return null

                const isActive = pathname === tab.href || (tab.href !== `/projects/${projectId}` && pathname.startsWith(tab.href))
                const Icon = tab.icon

                return (
                    <Link
                        key={tab.href}
                        id={tab.label === 'Teams' ? 'tour-teams-tab' : undefined}
                        href={tab.href}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${isActive
                            ? 'bg-white dark:bg-slate-800 text-[#6366f1] shadow-sm ring-1 ring-gray-300 dark:ring-slate-700'
                            : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200'
                            }`}
                    >
                        <Icon size={14} className={isActive ? 'text-[#6366f1]' : 'text-gray-400 dark:text-slate-400'} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
