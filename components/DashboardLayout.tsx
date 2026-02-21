'use client'

import React from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import HeaderTitle from '@/components/HeaderTitle'
import HeaderActions from '@/components/HeaderActions'
import { useRouter } from 'next/navigation'
import { Search, Menu } from 'lucide-react'
import { useSidebar } from './SidebarContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)
  const [userProfile, setUserProfile] = React.useState<any>(null)
  const { isCollapsed, setIsMobileOpen } = useSidebar()
  const supabase = createClientSupabaseClient()

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
  }, [supabase, router])

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
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
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-slate-950 flex">
      {/* Sidebar */}
      <Sidebar currentUser={currentUser} />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>

        {/* Floating Header */}
        <div className="sticky top-0 z-40 px-4 lg:px-8 pt-6 pb-5">
          <header className="max-w-[1400px] mx-auto w-full">
            {/*
              Outer box: H 94 but visually scaled down to match prototype proportion
              Outer radius: 22px — squircle, not a pill
              Inner elements: H 43, search W 629
            */}
            <div
              className="flex items-center bg-gray-200/90 dark:bg-slate-800/90 backdrop-blur-2xl shadow-sm"
              style={{
                height: '68px',
                borderRadius: '22px',
                padding: '0 14px',
                gap: '10px',
              }}
            >
              {/* Mobile menu button — 43×43 */}
              <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden flex-shrink-0 flex items-center justify-center bg-gray-300/80 dark:bg-slate-700/80 hover:bg-gray-300 dark:hover:bg-slate-700 rounded-xl text-gray-500 dark:text-slate-400 transition-colors"
                style={{ width: '43px', height: '43px' }}
              >
                <Menu size={18} />
              </button>

              {/* Search box: W 629 H 43 — fixed width, does NOT stretch */}
              <div
                className="relative group"
                style={{ width: '629px', height: '43px', flexShrink: 0, maxWidth: 'calc(100% - 200px)' }}
              >
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 dark:text-slate-500 group-focus-within:text-[#6366f1] transition-colors pointer-events-none">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full h-full pl-11 pr-4 bg-gray-300/80 dark:bg-slate-700/70 hover:bg-gray-300 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-700 border-none focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition-all text-sm font-medium text-gray-700 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  style={{ borderRadius: '12px' }}
                />
              </div>

              {/* Spacer — pushes actions to the right */}
              <div className="flex-1 min-w-[32px]" />

              {/* Right actions — with right padding matching left, gap between items */}
              <div className="flex items-center flex-shrink-0" style={{ gap: '8px', paddingRight: '4px' }}>
                <HeaderActions currentUser={currentUser} />
              </div>
            </div>
          </header>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}