import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SupportAnalyticsCharts from '@/components/support/SupportAnalyticsCharts'
import { LayoutDashboard, TrendingUp, AlertTriangle, Users, Shield } from 'lucide-react'

export default async function SupportAnalyticsPage() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('is_platform_admin').eq('id', user.id).single()
    if (!profile?.is_platform_admin) redirect('/dashboard')

    const { data: requests } = await supabase
        .from('support_requests')
        .select('*')

    if (!requests) return null

    const totalRequests = requests.length
    const openRequests = requests.filter(r => r.status !== 'Closed' && r.status !== 'Resolved').length
    const criticalIssues = requests.filter(r => r.severity === 'Critical').length
    const uniqueUsers = new Set(requests.map(r => r.user_id)).size

    return (
        <div className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                        Support Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 font-medium">
                        Real-time metrics and trends for platform support.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-500/10 px-6 py-3 rounded-2xl animate-pulse">
                    <TrendingUp className="text-indigo-500" size={20} />
                    <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-widest">Live Updates</span>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Volume', value: totalRequests, icon: LayoutDashboard, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                    { label: 'Pending Action', value: openRequests, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                    { label: 'Critical Bugs', value: criticalIssues, icon: Shield, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
                    { label: 'Active Reporters', value: uniqueUsers, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm group hover:scale-[1.02] transition-all">
                        <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center ${s.color} mb-6`}>
                            <s.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Component */}
            <SupportAnalyticsCharts requests={requests} />
        </div>
    )
}
