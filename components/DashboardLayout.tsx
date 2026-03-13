'use client'

import React from 'react'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import HeaderTitle from '@/components/HeaderTitle'
import HeaderActions from '@/components/HeaderActions'
import { useRouter } from 'next/navigation'
import { Search, Menu } from 'lucide-react'
import { useSidebar } from './SidebarContext'
import GlobalSearch from './GlobalSearch'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)
  const [userProfile, setUserProfile] = React.useState<any>(null)
  const { isCollapsed, setIsMobileOpen } = useSidebar()

  React.useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
    }
    getUser()
  }, [router])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const input = document.getElementById('dashboard-search-input') as HTMLInputElement
      if (input && input === document.activeElement && !input.contains(event.target as Node)) {
        input.blur()
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        const input = document.getElementById('dashboard-search-input') as HTMLInputElement
        if (input) input.focus()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    )
  }

  const currentUser = {
    id: user.id,
    email: user.email || '',
    full_name: userProfile?.full_name || user.user_metadata?.full_name,
    avatar_url: userProfile?.avatar_url,
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-white dark:bg-slate-950">

      {/* ── SIDEBAR ── */}
      <Sidebar currentUser={currentUser} />

      {/* ── MAIN CONTENT AREA ── */}
      {/*
        Responsive left padding rules:
          mobile (< lg):  no padding — sidebar is a drawer overlay
          lg collapsed:   pl-20  (80px icon-only sidebar)
          lg expanded:    pl-64  (256px full sidebar)
      */}
      <div
        className={`
          flex-1 flex flex-col min-h-screen relative z-10
          transition-[padding] duration-300 ease-in-out
          pl-0
          ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
        `}
      >

        {/* ── FLOATING HEADER ── */}
        <div className="sticky top-0 z-40 px-3 sm:px-4 lg:px-8 pt-3 sm:pt-4 lg:pt-6 pb-2">
          <header className="max-w-[1400px] mx-auto w-full">
            <div
              className="
                flex items-center backdrop-blur-2xl
                bg-white/65 border border-white/80
                shadow-[0_4px_24px_rgba(147,197,253,0.15),0_1px_3px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(255,255,255,0.85)]
                dark:bg-[rgba(15,15,28,0.72)] dark:border-[rgba(139,92,246,0.18)]
                dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_8px_32px_rgba(0,0,0,0.4),0_0_60px_rgba(139,92,246,0.06)]
              "
              style={{
                height: '56px',        /* mobile: a bit shorter */
                borderRadius: '16px',  /* mobile: slightly tighter radius */
                padding: '0 10px',
                gap: '8px',
              }}
              /* Override height/radius at lg via inline — Tailwind can't do arbitrary height in responsive shorthand easily */
              ref={(el) => {
                if (!el) return
                const update = () => {
                  const isLg = window.innerWidth >= 1024
                  const isSm = window.innerWidth >= 640
                  el.style.height = isLg ? '68px' : isSm ? '60px' : '52px'
                  el.style.borderRadius = isLg ? '22px' : isSm ? '18px' : '14px'
                  el.style.padding = isLg ? '0 14px' : '0 10px'
                }
                update()
                window.addEventListener('resize', update)
                return () => window.removeEventListener('resize', update)
              }}
            >
              {/* ── Mobile / tablet menu button — hidden on lg ── */}
              <button
                onClick={() => setIsMobileOpen(true)}
                className="
                  lg:hidden flex-shrink-0
                  flex items-center justify-center
                  rounded-xl transition-colors
                  bg-black/[0.05] hover:bg-black/[0.09] text-gray-500
                  dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-400
                  w-9 h-9 sm:w-10 sm:h-10
                "
              >
                <Menu size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              {/* ── Search box ──
                  mobile:  fills available space (flex-1), no fixed width
                  sm+:     still flex-1 but capped
                  lg+:     fixed 629px max, flex-shrink-0
              */}
              <div
                className="
                  relative group
                  flex-1 lg:flex-shrink-0 lg:flex-initial
                  h-9 sm:h-10 lg:h-[43px]
                  min-w-0
                "
                style={{
                  /* On lg+, cap at 629px; on smaller screens let it be fluid */
                  maxWidth: '100%',
                }}
                ref={(el) => {
                  if (!el) return
                  const update = () => {
                    if (window.innerWidth >= 1024) {
                      el.style.width = '629px'
                      el.style.maxWidth = 'calc(100% - 180px)'
                    } else {
                      el.style.width = 'auto'
                      el.style.maxWidth = '100%'
                    }
                  }
                  update()
                  window.addEventListener('resize', update)
                  return () => window.removeEventListener('resize', update)
                }}
              >
                <span className="
                  absolute inset-y-0 left-0 pl-3 sm:pl-4
                  flex items-center pointer-events-none transition-colors
                  text-[#6366f1] group-focus-within:text-blue-500
                  dark:text-teal-500 dark:group-focus-within:text-teal-400
                ">
                  <Search size={14} className="sm:w-[15px] sm:h-[15px]" />
                </span>
                <input
                  id="dashboard-search-input"
                  type="text"
                  placeholder="Search missions, boards, teams..."
                  className="
                    block w-full h-full
                    pl-9 sm:pl-11 pr-12 sm:pr-14
                    rounded-xl sm:rounded-[12px]
                    border transition-all
                    text-xs sm:text-sm font-medium
                    focus:outline-none focus:ring-2

                    bg-blue-50/50 border-blue-100/80
                    hover:bg-blue-50/70 focus:bg-white/90
                    text-gray-700 placeholder:text-gray-400
                    focus:ring-blue-200/60 focus:border-blue-200/80

                    dark:bg-white/[0.05] dark:border-white/[0.07]
                    dark:hover:bg-white/[0.08] dark:focus:bg-white/[0.08]
                    dark:text-slate-200 dark:placeholder:text-slate-600
                    dark:focus:ring-teal-400/25 dark:focus:border-teal-400/30
                  "
                />
                <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none transition-opacity duration-300">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm text-[11px] font-black text-gray-400 dark:text-slate-500 tracking-tight">
                    <span className="text-[13px] opacity-70">⌘</span>
                    <span className="mt-0.5">K</span>
                  </div>
                </div>
              </div>

              {/* ── Spacer — only meaningful on lg where search has fixed width ── */}
              <div className="hidden lg:block flex-1 min-w-[16px]" />

              {/* ── Right actions ── */}
              <div className="flex items-center flex-shrink-0 gap-1.5 sm:gap-2 pr-0.5 sm:pr-1">
                <HeaderActions currentUser={currentUser} />
              </div>
            </div>
          </header>
        </div>

        {/* ── PAGE CONTENT ── */}
        {/*
          Padding scale:
            mobile:  px-3  py-3   (tight, thumb-friendly)
            sm:      px-4  py-4
            lg:      px-8  py-8   (desktop breathing room)
        */}
        <main className="flex-1 px-3 sm:px-4 lg:px-8 pb-3 sm:pb-4 lg:pb-8 pt-2 sm:pt-4 lg:pt-6 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}