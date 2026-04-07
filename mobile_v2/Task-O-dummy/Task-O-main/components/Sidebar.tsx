'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
    Home,
    LayoutDashboard,
    Users,
    FolderKanban,
    ClipboardList,
    BarChart3,
    Settings,
    Bell,
    MessageSquare,
    LogOut,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Plus,
    ArrowLeft,
    User,
    HelpCircle,
    UserPlus,
    X,
    Menu,
    Shield,
    PieChart,
    Calendar,
    Play
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useSidebar } from './SidebarContext'
import TutorialModal from './TutorialModal'

interface SidebarProps {
    currentUser: {
        id: string
        email?: string
        full_name?: string
        avatar_url?: string
    }
}

export default function Sidebar({ currentUser }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isTutorialOpen, setIsTutorialOpen] = useState(false)
    const [showTutorialGlow, setShowTutorialGlow] = useState(false)
    const [projectContext, setProjectContext] = useState<{ id: string; name: string; role: string } | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)

    const projectIdMatch = pathname.match(/\/projects\/([^\/]+)/)
    const currentProjectId = projectIdMatch ? projectIdMatch[1] : null

    const [projects, setProjects] = useState<any[]>([])
    const [isProjectsExpanded, setIsProjectsExpanded] = useState(true)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser?.id) return

            if (currentProjectId) {
                const { data: project } = await supabase
                    .from('projects')
                    .select('id, name')
                    .eq('id', currentProjectId)
                    .single()

                const { data: membership } = await supabase
                    .from('project_members')
                    .select('role')
                    .eq('project_id', currentProjectId)
                    .eq('user_id', currentUser.id)
                    .single()

                if (project && membership) {
                    setProjectContext({ id: project.id, name: project.name, role: membership.role })
                }
            } else {
                setProjectContext(null)
            }

            const { data: userProjects } = await supabase
                .from('project_members')
                .select(`project_id, project:project_id (id, name)`)
                .eq('user_id', currentUser.id)
                .order('joined_at', { ascending: false })

            if (userProjects) {
                let projectList = userProjects.map((p: any) => p.project).filter(Boolean)

                if (projectList.length < userProjects.length) {
                    const missingIds = userProjects
                        .filter((p: any) => !p.project)
                        .map((p: any) => p.project_id)

                    if (missingIds.length > 0) {
                        const { data: directProjects } = await supabase
                            .from('projects')
                            .select('id, name')
                            .in('id', missingIds)

                        if (directProjects) {
                            projectList = [...projectList, ...directProjects]
                        }
                    }
                }
                setProjects(projectList)
            }

            // Check if platform admin
            const { data: userData } = await supabase
                .from('users')
                .select('is_platform_admin')
                .eq('id', currentUser.id)
                .single()

            if (userData) {
                setIsAdmin(userData.is_platform_admin)
            }
        }

        fetchData()

        const projectMemberChannel = supabase
            .channel('sidebar-projects')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'project_members',
                filter: `user_id=eq.${currentUser.id}`,
            }, () => { fetchData() })
            .subscribe()

        return () => { supabase.removeChannel(projectMemberChannel) }
    }, [currentProjectId, currentUser?.id])

    const [unreadCount, setUnreadCount] = useState(0)
    const [openSupportCount, setOpenSupportCount] = useState(0)

    useEffect(() => {
        if (!currentUser?.id) return

        const fetchUnreadCount = async () => {
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', currentUser.id)
                .eq('read', false)

            if (count !== null) setUnreadCount(count)
        }

        fetchUnreadCount()

        const channel = supabase
            .channel('sidebar-notifications')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${currentUser.id}`,
            }, () => { fetchUnreadCount() })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [currentUser?.id])

    useEffect(() => {
        if (!isAdmin || !currentUser?.id) return

        const fetchOpenSupportCount = async () => {
            const { count } = await supabase
                .from('support_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Open')

            if (count !== null) setOpenSupportCount(count)
        }

        fetchOpenSupportCount()

        const channel = supabase
            .channel('sidebar-support-requests')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'support_requests',
            }, () => { fetchOpenSupportCount() })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [isAdmin, currentUser?.id])

    // Auto-trigger tutorial for new users
    useEffect(() => {
        if (pathname === '/dashboard') {
            const hasSeen = localStorage.getItem('hasSeenTutorial')
            if (!hasSeen) {
                // Check if we are already in a tour
                const activeTour = localStorage.getItem('activeTour')
                if (!activeTour) {
                    setIsTutorialOpen(true)
                    localStorage.setItem('hasSeenTutorial', 'true')
                }
            }
        }
    }, [pathname])

    // Load tutorial glow state
    useEffect(() => {
        const isDismissed = localStorage.getItem('tutorialDismissed') === 'true'
        setShowTutorialGlow(!isDismissed)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }


    const navLinkClass = (active: boolean) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group ${active
            ? 'bg-[#f3f4ff] dark:bg-[#0077B6]/10 text-[#0077B6] font-black'
            : 'text-gray-900 dark:text-gray-300 hover:text-[#0077B6] dark:hover:text-[#0077B6] font-bold'
        }`

    const navIconClass = (active: boolean) =>
        active
            ? 'text-[#0077B6]'
            : 'text-gray-900 dark:text-gray-300 group-hover:text-[#0077B6] dark:group-hover:text-[#0077B6]'

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[45] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-gray-300 dark:border-slate-800 transition-all duration-300 flex flex-col z-[60] 
                ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'} 
                ${isCollapsed && !isMobileOpen ? 'lg:w-20' : 'lg:w-64'}
            `}>

                {/* Brand / Toggle */}
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        {(!isCollapsed || isMobileOpen) && (
                            <Link href="/dashboard" className="flex items-center gap-3 transition-transform hover:scale-105">
                                <Image
                                    src="/task-o.png"
                                    alt="Task-O Logo"
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 object-contain"
                                />
                                <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Task-O</span>
                            </Link>
                        )}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400"
                            >
                                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                            </button>
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scrollbar-hide">

                    {/* Home */}
                    <Link
                        id="sidebar-home"
                        href="/dashboard"
                        onClick={() => setIsMobileOpen(false)}
                        className={navLinkClass(pathname === '/dashboard')}
                    >
                        <Home size={18} className={navIconClass(pathname === '/dashboard')} />
                        {(!isCollapsed || isMobileOpen) && <span className="text-[11px] uppercase tracking-widest">Home</span>}
                    </Link>

                    {/* Projects (Expandable) */}
                    <div className="space-y-1">
                        <div className="flex items-center group">
                            <Link
                                id="sidebar-projects"
                                href="/projects"
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex-1 ${navLinkClass(pathname.startsWith('/projects') && !currentProjectId)}`}
                            >
                                <LayoutDashboard size={18} className={navIconClass(pathname.startsWith('/projects') && !currentProjectId)} />
                                {(!isCollapsed || isMobileOpen) && <span className="text-[11px] uppercase tracking-widest">Projects</span>}
                            </Link>
                            {(!isCollapsed || isMobileOpen) && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsProjectsExpanded(!isProjectsExpanded);
                                    }}
                                    className="p-2 text-gray-400 hover:text-[#0077B6] transition-colors rounded-xl"
                                >
                                    <div className={`transition-transform duration-200 ${isProjectsExpanded ? 'rotate-90' : ''}`}>
                                        <ChevronRight size={12} />
                                    </div>
                                </button>
                            )}
                        </div>

                        {isProjectsExpanded && projects.length > 0 && (!isCollapsed || isMobileOpen) && (
                            <div className="space-y-1 pl-6 py-1">
                                {projects.map((p) => {
                                    const isActive = currentProjectId === p.id
                                    return (
                                        <Link
                                            key={p.id}
                                            href={`/projects/${p.id}`}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all truncate group ${isActive
                                                ? 'text-[#0077B6] font-black bg-[#f3f4ff]/50 dark:bg-[#0077B6]/5'
                                                : 'text-gray-900 dark:text-gray-400 hover:text-[#0077B6] dark:hover:text-[#0077B6] font-bold'
                                                }`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-[#0077B6] shadow-[0_0_8px_rgba(0,119,182,0.5)]' : 'bg-gray-300 dark:bg-slate-700 group-hover:bg-[#0077B6]'}`} />
                                            <span className="text-[10px] uppercase tracking-tight truncate">{p.name}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Inbox */}
                    <Link
                        href="/inbox"
                        onClick={() => setIsMobileOpen(false)}
                        className={navLinkClass(pathname === '/inbox')}
                    >
                        <MessageSquare size={18} className={navIconClass(pathname === '/inbox')} />
                        {(!isCollapsed || isMobileOpen) && <span className="text-[11px] uppercase tracking-widest">Inbox</span>}
                        {(!isCollapsed || isMobileOpen) && unreadCount > 0 && (
                            <span className="absolute right-3 px-1.5 py-0.5 bg-[#0077B6] text-white text-[8px] font-black rounded-lg shadow-sm ring-2 ring-white dark:ring-slate-900 animate-in zoom-in duration-300">
                                {unreadCount}
                            </span>
                        )}
                    </Link>

                    {/* Calendar */}
                    <Link
                        href="/calendar"
                        onClick={() => setIsMobileOpen(false)}
                        className={navLinkClass(pathname === '/calendar')}
                    >
                        <Calendar size={18} className={navIconClass(pathname === '/calendar')} />
                        {(!isCollapsed || isMobileOpen) && <span className="text-[11px] uppercase tracking-widest">Calendar</span>}
                    </Link>

                    {/* Settings */}
                    <Link
                        href="/settings"
                        onClick={() => setIsMobileOpen(false)}
                        className={navLinkClass(pathname === '/settings')}
                    >
                        <Settings size={18} className={navIconClass(pathname === '/settings')} />
                        {(!isCollapsed || isMobileOpen) && <span className="text-[11px] uppercase tracking-widest">Settings</span>}
                    </Link>

                    {/* Support */}
                    <Link
                        href="/support"
                        onClick={() => setIsMobileOpen(false)}
                        className={navLinkClass(pathname.startsWith('/support'))}
                    >
                        <HelpCircle size={18} className={navIconClass(pathname.startsWith('/support'))} />
                        {(!isCollapsed || isMobileOpen) && <span className="text-[11px] uppercase tracking-widest">Support</span>}
                    </Link>

                    <button
                        id="sidebar-tutorial"
                        onClick={() => {
                            setIsMobileOpen(false)
                            setIsTutorialOpen(true)
                        }}
                        className={`w-full ${navLinkClass(isTutorialOpen)}`}
                    >
                        <Play size={18} className={navIconClass(isTutorialOpen)} />
                        {(!isCollapsed || isMobileOpen) && (
                            <div className="flex flex-1 items-center justify-between">
                                <span className="text-[11px] uppercase tracking-widest text-left">Tutorial</span>
                                {showTutorialGlow && (
                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-annoying-glow shadow-[0_0_10px_rgba(239,68,68,0.5)] ring-2 ring-white dark:ring-slate-900 mr-1.5"></span>
                                )}
                            </div>
                        )}
                        {isCollapsed && !isMobileOpen && showTutorialGlow && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-annoying-glow shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                        )}
                    </button>

                    {/* Admin Panel */}
                    {isAdmin && (
                        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
                            {(!isCollapsed || isMobileOpen) && (
                                <p className="px-3 text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">
                                    Admin Panel
                                </p>
                            )}

                            <Link
                                href="/admin/support"
                                onClick={() => setIsMobileOpen(false)}
                                className={navLinkClass(pathname.startsWith('/admin/support') && !pathname.includes('analytics'))}
                            >
                                <Shield size={18} className={navIconClass(pathname.startsWith('/admin/support') && !pathname.includes('analytics'))} />
                                {(!isCollapsed || isMobileOpen) && (
                                    <div className="flex flex-1 items-center justify-between">
                                        <span className="text-[11px] uppercase tracking-widest">Support Management</span>
                                        {openSupportCount > 0 && (
                                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-annoying-glow shadow-[0_0_10px_rgba(239,68,68,0.5)] ring-2 ring-white dark:ring-slate-900 mr-1.5"></span>
                                        )}
                                    </div>
                                )}
                                {isCollapsed && !isMobileOpen && openSupportCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-annoying-glow shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                                )}
                            </Link>

                            <Link
                                href="/admin/support/analytics"
                                onClick={() => setIsMobileOpen(false)}
                                className={navLinkClass(pathname.includes('analytics'))}
                            >
                                <PieChart size={18} className={navIconClass(pathname.includes('analytics'))} />
                                {(!isCollapsed || isMobileOpen) && <span className="text-[11px] uppercase tracking-widest">Support Analytics</span>}
                            </Link>
                        </div>
                    )}


                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group text-gray-900 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 font-bold"
                    >
                        <LogOut size={18} className="text-gray-900 dark:text-gray-300 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
                        {(!isCollapsed || isMobileOpen) && <span className="text-[11px] uppercase tracking-widest">Logout</span>}
                    </button>

                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-gray-300 dark:border-slate-800 relative" ref={profileRef}>
                    {isProfileOpen && (
                        <div className={`absolute bottom-full mb-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-300 dark:border-slate-800 py-2 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200 ${isCollapsed ? 'left-4 w-48' : 'left-4 right-4'}`}>
                            <Link
                                href="/settings/profile"
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-[#f3f4ff] dark:hover:bg-slate-800 hover:text-[#0077B6] transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <User size={18} />
                                </div>
                                My Profile
                            </Link>
                            <Link
                                href="/help"
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-[#f3f4ff] dark:hover:bg-slate-800 hover:text-[#0077B6] transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <HelpCircle size={18} />
                                </div>
                                Help and Support
                            </Link>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('hasSeenTutorial');
                                    localStorage.removeItem('activeTour');
                                    localStorage.removeItem('activeTourStep');
                                    localStorage.removeItem('tutorialDismissed');
                                    window.location.reload();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-colors border-t border-gray-100 dark:border-slate-800"
                            >
                                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                                    <X size={18} />
                                </div>
                                Reset Tutorial
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${isProfileOpen ? 'bg-gray-50 dark:bg-slate-800' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-[#0077B6] overflow-hidden shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {currentUser.avatar_url ? (
                                <Image
                                    src={currentUser.avatar_url}
                                    alt={currentUser.full_name || 'User avatar'}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                currentUser.full_name?.[0] || currentUser.email?.[0]
                            )}
                        </div>
                        {(!isCollapsed || isMobileOpen) && (
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                    {currentUser.full_name || 'User'}
                                </p>
                                <p className="text-[10px] font-medium text-gray-400 dark:text-slate-500 truncate mt-0.5">
                                    {currentUser.email}
                                </p>
                            </div>
                        )}
                    </button>
                </div>

            </aside>

            <TutorialModal
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
                isDismissed={!showTutorialGlow}
                onToggleDismissal={(checked) => {
                    localStorage.setItem('tutorialDismissed', checked ? 'true' : 'false');
                    setShowTutorialGlow(!checked);
                }}
            />
        </>
    )
}