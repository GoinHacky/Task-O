'use client'

import React from 'react'
import { supabase } from '@/lib/supabase/client'
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
      {/* Sidebar - fixed width */}
      <Sidebar currentUser={currentUser} />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300
        ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
      `}>
        {/* Top Navigation Bar */}
        <header className="h-20 bg-white/70 dark:bg-slate-950/40 backdrop-blur-2xl border-b border-gray-100 dark:border-slate-800/50 sticky top-0 z-40">
          <div className="max-w-[1400px] mx-auto w-full h-full flex items-center justify-between px-4 lg:px-8">
            <div className="flex-1 flex items-center gap-4">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-500"
              >
                <Menu size={20} />
              </button>
              <HeaderTitle />
            </div>

            <div className="hidden sm:flex flex-[2] max-w-xl mx-4">
              <div className="relative group w-full">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-[#6366f1] transition-colors">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-4 py-2 bg-gray-100/50 dark:bg-slate-800/40 border-none rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/10 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex-1 flex justify-end">
              <HeaderActions currentUser={currentUser} />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

