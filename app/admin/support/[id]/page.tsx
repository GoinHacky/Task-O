import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, Clock, User, Globe, Info, MessageCircle, FileText, History, Shield } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { addSupportComment } from '@/lib/support/actions'
import { StatusSelect, SeveritySelect, AdminActionButtons } from '@/components/support/AdminEditorControls'

const statusColors: Record<string, string> = {
    'Open': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'Reviewed': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Resolved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Closed': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
}

export default async function AdminSupportDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Check if platform admin
    const { data: profile } = await supabase.from('users').select('is_platform_admin').eq('id', user.id).single()
    if (!profile?.is_platform_admin) redirect('/dashboard')

    // Fetch request details
    const { data: request } = await supabase
        .from('support_requests')
        .select(`
            *,
            user:user_id (full_name, email)
        `)
        .eq('id', params.id)
        .single()

    if (!request) redirect('/admin/support')

    // Fetch comments
    const { data: comments } = await supabase
        .from('support_comments')
        .select(`
            *,
            user:user_id (full_name, avatar_url)
        `)
        .eq('request_id', params.id)
        .order('created_at', { ascending: true })

    // Fetch activity log
    const { data: timeline } = await supabase
        .from('support_activity_log')
        .select(`
            *,
            user:user_id (full_name)
        `)
        .eq('request_id', params.id)
        .order('created_at', { ascending: true })

    async function handleAdminAction(formData: FormData) {
        'use server'
        const content = formData.get('admin_note') as string
        if (!content) return
        await addSupportComment(params.id, content, true)
        revalidatePath(`/admin/support/${params.id}`)
    }

    async function handlePublicReply(formData: FormData) {
        'use server'
        const content = formData.get('reply') as string
        if (!content) return
        await addSupportComment(params.id, content, false)
        revalidatePath(`/admin/support/${params.id}`)
    }

    return (
        <div className="max-w-[1600px] mx-auto p-6 lg:p-10 pb-20">
            <Link
                href="/admin/support"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white font-bold mb-8 transition-colors group"
            >
                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                Back to Support Management
            </Link>

            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-[#0077B6] tracking-widest">{request.ticket_id}</span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColors[request.status]}`}>
                            {request.status}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{request.title}</h1>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <StatusSelect
                        requestId={params.id}
                        initialValue={request.status}
                        statuses={Object.keys(statusColors)}
                    />
                    <SeveritySelect
                        requestId={params.id}
                        initialValue={request.severity}
                    />
                    <AdminActionButtons requestId={params.id} />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Details & Conversation */}
                <div className="lg:col-span-2 space-y-10">
                    {/* User Info & Issue Description */}
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2.5rem] p-8 lg:p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-50 dark:border-slate-800/50">
                            <div className="w-12 h-12 bg-[#0077B6] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                                {request.user.full_name[0]}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">{request.user.full_name}</h3>
                                <p className="text-sm text-gray-400 dark:text-slate-500 font-medium">{request.user.email}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-gray-500">
                                <Clock size={14} />
                                {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="prose dark:prose-invert max-w-none">
                                <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <FileText size={14} />
                                    Detailed Description
                                </h4>
                                <p className="text-gray-600 dark:text-slate-300 font-medium leading-relaxed bg-gray-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-50 dark:border-slate-800/30">
                                    {request.description}
                                </p>
                            </div>

                            {request.steps_to_reproduce && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Steps to Reproduce</h4>
                                        <div className="bg-gray-50/30 dark:bg-slate-900/30 p-5 rounded-2xl border border-gray-50 dark:border-slate-800/30 text-xs font-medium text-gray-500 dark:text-slate-400 whitespace-pre-wrap">
                                            {request.steps_to_reproduce}
                                        </div>
                                    </div>
                                    {request.expected_result && (
                                        <div>
                                            <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Expected Result</h4>
                                            <div className="bg-green-50/10 dark:bg-green-500/5 p-5 rounded-2xl border border-green-500/10 text-xs font-medium text-gray-500 dark:text-slate-400 whitespace-pre-wrap">
                                                {request.expected_result}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Internal Admin Note */}
                    <div className="bg-amber-50/30 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20 rounded-[2.5rem] p-8">
                        <h3 className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Shield size={18} />
                            Internal Admin Notes
                        </h3>
                        <form action={handleAdminAction} className="space-y-4">
                            <textarea
                                name="admin_note"
                                rows={3}
                                className="w-full bg-white dark:bg-slate-900 border border-amber-200/50 dark:border-amber-500/20 rounded-2xl p-6 text-sm outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-medium text-gray-700 dark:text-slate-300"
                                placeholder="Add a private note only admins can see..."
                            />
                            <div className="flex justify-end">
                                <button className="px-6 py-3 bg-amber-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-amber-600/20 hover:scale-105 active:scale-95 transition-all">
                                    Save Internal Note
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Conversation & Replies */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-3">
                            <MessageCircle size={18} />
                            Communication Pipeline
                        </h3>

                        <div className="space-y-4">
                            {comments?.map((comment: any) => (
                                <div key={comment.id} className={`flex gap-4 ${comment.is_admin_note ? 'bg-amber-50/30 dark:bg-amber-500/5 p-6 rounded-3xl border border-amber-200/50 dark:border-amber-500/20' : ''}`}>
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center font-bold text-gray-400 shrink-0">
                                        {comment.user.full_name[0]}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-gray-900 dark:text-white">{comment.user.full_name}</span>
                                            {comment.is_admin_note && (
                                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest border border-amber-200 px-1.5 py-0.5 rounded-md">ADMIN NOTE</span>
                                            )}
                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium ml-auto">
                                                {format(new Date(comment.created_at), 'MMM dd, HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Public Reply Form */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                            <form action={handlePublicReply} className="space-y-4">
                                <textarea
                                    name="reply"
                                    rows={4}
                                    className="w-full bg-gray-50/50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 text-sm outline-none focus:ring-4 focus:ring-[#0077B6]/10 transition-all font-medium text-gray-700 dark:text-slate-300"
                                    placeholder="Add a public reply to the user..."
                                />
                                <div className="flex justify-end">
                                    <button className="px-8 py-4 bg-[#0077B6] text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                                        Send Reply to User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Right Column: System Info & Activity */}
                <div className="space-y-10">
                    {/* System Information */}
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-gray-900 dark:text-white">
                            <Globe size={120} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Info size={18} />
                            Logistics & Intel
                        </h3>
                        <div className="space-y-6 relative z-10">
                            {[
                                { label: 'Location Context', value: request.where_did_it_happen || 'Unknown', icon: Globe },
                                { label: 'Reference Page', value: request.page_url || 'N/A', isLink: true },
                                { label: 'Browser Env', value: request.browser_info?.userAgent?.split(' ')[0] + ' ' + request.browser_info?.platform || 'Unknown' },
                                { label: 'Resolution', value: request.browser_info?.screenResolution || 'Unknown' },
                            ].map((info, i) => (
                                <div key={i} className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{info.label}</p>
                                    <p className={`text-xs font-bold truncate ${info.isLink ? 'text-[#0077B6] hover:underline cursor-pointer' : 'text-gray-900 dark:text-gray-200'}`}>
                                        {info.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                            <History size={18} />
                            Activity Timeline
                        </h3>
                        <div className="space-y-8">
                            {timeline?.map((log: any, i: number) => (
                                <div key={log.id} className="relative flex gap-4">
                                    {i !== timeline.length - 1 && (
                                        <div className="absolute left-[11px] top-7 bottom-[-20px] w-0.5 bg-gray-50 dark:bg-slate-800/50" />
                                    )}
                                    <div className="w-6 h-6 rounded-lg bg-[#0077B6]/10 text-[#0077B6] flex items-center justify-center shrink-0 mt-0.5">
                                        <Clock size={12} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white">
                                            {log.action}
                                            {log.to_value && <span className="text-[#0077B6] ml-1">→ {log.to_value}</span>}
                                        </p>
                                        <p className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">
                                            {log.user.full_name} • {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
