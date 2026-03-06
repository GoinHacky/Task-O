import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { Shield, AlertTriangle, Clock, CheckCircle2, ChevronRight } from 'lucide-react'
import AdminSupportFilters from '@/components/support/AdminSupportFilters'

const statusColors: Record<string, string> = {
    'Open': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'Reviewed': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Resolved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Closed': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
}

export default async function AdminSupportDashboard({ searchParams }: { searchParams: { status?: string, severity?: string } }) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Check if platform admin
    const { data: profile } = await supabase.from('users').select('is_platform_admin').eq('id', user.id).single()
    if (!profile?.is_platform_admin) redirect('/dashboard')

    // Fetch summary stats
    const { data: allRequests } = await supabase.from('support_requests').select('status, severity, created_at')

    const stats = {
        total: allRequests?.length || 0,
        open: allRequests?.filter(r => r.status === 'Open').length || 0,
        critical: allRequests?.filter(r => r.severity === 'Critical' && r.status !== 'Closed').length || 0,
        avgResolution: '2.4d' // Placeholder for now
    }

    // Build query with filters
    let query = supabase
        .from('support_requests')
        .select(`
            *,
            user:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false })

    if (searchParams.status) query = query.eq('status', searchParams.status)
    if (searchParams.severity) query = query.eq('severity', searchParams.severity)

    const { data: requests } = await query

    return (
        <div className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-10">
            <header>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                    Support Management
                </h1>
                <p className="text-gray-500 dark:text-slate-400 font-medium">
                    Overview and resolution of all platform support issues.
                </p>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Requests', value: stats.total, icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                    { label: 'Open Requests', value: stats.open, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                    { label: 'Critical Issues', value: stats.critical, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
                    { label: 'Avg Resolution Time', value: stats.avgResolution, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center ${s.color} mb-4`}>
                            <s.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <AdminSupportFilters statuses={Object.keys(statusColors)} />

            {/* Requests Table */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-slate-800">
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">ID</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Title</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Reported By</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Category</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Severity</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Created</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                        {requests?.map((req: any) => (
                            <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <span className="text-xs font-black text-[#0077B6]">{req.ticket_id}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs">{req.title}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{req.user.full_name}</span>
                                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{req.user.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{req.category}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`text-xs font-black ${req.severity === 'Critical' ? 'text-red-500' :
                                            req.severity === 'High' ? 'text-orange-500' :
                                                req.severity === 'Medium' ? 'text-blue-500' : 'text-gray-500'
                                        }`}>
                                        {req.severity}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${statusColors[req.status]}`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
                                        {format(new Date(req.created_at), 'MMM dd')}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <Link
                                        href={`/admin/support/${req.id}`}
                                        className="inline-flex items-center gap-2 text-[10px] font-black text-[#0077B6] uppercase tracking-widest hover:underline"
                                    >
                                        View Detail
                                        <ChevronRight size={14} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!requests || requests.length === 0) && (
                    <div className="p-20 text-center">
                        <p className="text-gray-500 dark:text-slate-400 font-bold">No support requests found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
