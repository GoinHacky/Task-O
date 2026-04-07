'use client'

import React from 'react'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import HeaderTitle from '@/components/HeaderTitle'
import HeaderActions from '@/components/HeaderActions'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
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
    // Redundant search logic removed - handled in GlobalSearch.tsx
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
              <GlobalSearch />

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