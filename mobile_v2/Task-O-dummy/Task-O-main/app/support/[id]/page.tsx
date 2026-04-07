import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Clock, MessageSquare, Shield, Activity, User } from 'lucide-react'
import { format } from 'date-fns'
import { addSupportComment } from '@/lib/support/actions'
import { revalidatePath } from 'next/cache'

const statusColors: Record<string, string> = {
    'Open': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'Reviewed': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Resolved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Closed': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
}

const severityColors: Record<string, string> = {
    'Low': 'text-gray-500',
    'Medium': 'text-blue-500',
    'High': 'text-orange-500',
    'Critical': 'text-red-500 font-bold',
}

export default async function SupportDetail({ params }: { params: { id: string } }) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch support request
    const { data: request } = await supabase
        .from('support_requests')
        .select(`
            *,
            user:user_id (id, full_name, email, avatar_url)
        `)
        .eq('id', params.id)
        .single()

    if (!request) notFound()

    // Fetch comments
    const { data: comments } = await supabase
        .from('support_comments')
        .select(`
            *,
            user:user_id (id, full_name, avatar_url)
        `)
        .eq('request_id', params.id)
        .eq('is_admin_note', false)
        .order('created_at', { ascending: true })

    // Fetch activity log
    const { data: activity } = await supabase
        .from('support_activity_log')
        .select(`
            *,
            user:user_id (id, full_name)
        `)
        .eq('request_id', params.id)
        .order('created_at', { ascending: true })

    async function handleComment(formData: FormData) {
        'use server'
        const content = formData.get('content') as string
        if (!content) return
        await addSupportComment(params.id, content)
        revalidatePath(`/support/${params.id}`)
    }

    return (
        <div className="max-w-5xl mx-auto p-6 lg:p-10 pb-20">
            <Link
                href="/support"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white font-bold mb-8 transition-colors group"
            >
                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                Back to Support
            </Link>

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                            {request.ticket_id}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColors[request.status]}`}>
                            {request.status}
                        </span>
                        {request.severity === 'Critical' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                Critical
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        {request.title}
                    </h1>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Submitted on</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {format(new Date(request.created_at), 'MMMM dd, yyyy @ HH:mm')}
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Details Section */}
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 space-y-8">
                        <div>
                            <h3 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Description</h3>
                            <div className="text-gray-900 dark:text-gray-200 font-medium whitespace-pre-wrap leading-relaxed">
                                {request.description}
                            </div>
                        </div>

                        {request.steps_to_reproduce && (
                            <div>
                                <h3 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Steps to Reproduce</h3>
                                <div className="text-gray-900 dark:text-gray-200 font-medium whitespace-pre-wrap leading-relaxed">
                                    {request.steps_to_reproduce}
                                </div>
                            </div>
                        )}

                        {request.expected_result && (
                            <div>
                                <h3 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Expected Result</h3>
                                <div className="text-gray-900 dark:text-gray-200 font-medium whitespace-pre-wrap leading-relaxed">
                                    {request.expected_result}
                                </div>
                            </div>
                        )}

                        {request.screenshot_url && (
                            <div>
                                <h3 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Screenshot</h3>
                                <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800">
                                    <Image src={request.screenshot_url} alt="Support Screenshot" width={800} height={450} className="w-full h-auto" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="text-[#0077B6]" size={20} />
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Conversation</h2>
                        </div>

                        <div className="space-y-6">
                            {comments?.map((comment) => (
                                <div key={comment.id} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                        {comment.user.avatar_url ? (
                                            <Image src={comment.user.avatar_url} alt={comment.user.full_name} width={40} height={40} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="text-gray-400" size={20} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{comment.user.full_name}</span>
                                            <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">
                                                {format(new Date(comment.created_at), 'MMM dd, HH:mm')}
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl rounded-tl-none p-4 text-gray-800 dark:text-gray-200 font-medium">
                                            {comment.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Comment Form */}
                        <form action={handleComment} className="mt-8 flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-xl bg-[#0077B6] flex items-center justify-center shrink-0 text-white font-bold">
                                {user.email?.[0].toUpperCase()}
                            </div>
                            <div className="flex-1 space-y-3">
                                <textarea
                                    name="content"
                                    required
                                    rows={3}
                                    placeholder="Add a comment or ask for updates..."
                                    className="w-full px-6 py-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-[#0077B6]/10 text-gray-900 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-slate-600 outline-none transition-all resize-none"
                                />
                                <button className="px-6 py-2 bg-[#0077B6] hover:bg-[#005F92] text-white font-bold rounded-xl transition-all shadow-lg active:scale-95">
                                    Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8">
                    {/* Activity Timeline */}
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="text-gray-400" size={18} />
                            <h3 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Activity History</h3>
                        </div>

                        <div className="space-y-6">
                            {activity?.map((log, idx) => (
                                <div key={log.id} className="relative flex gap-4">
                                    {idx !== activity.length - 1 && (
                                        <div className="absolute left-[11px] top-6 w-0.5 h-full bg-gray-100 dark:bg-slate-800" />
                                    )}
                                    <div className="w-6 h-6 rounded-full bg-gray-50 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center shrink-0 z-10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600" />
                                    </div>
                                    <div className="pb-4">
                                        <p className="text-[10px] font-bold text-gray-900 dark:text-white">
                                            {log.action}
                                            {log.to_value && <span className="text-gray-400 dark:text-slate-500 font-medium"> → {log.to_value}</span>}
                                        </p>
                                        <p className="text-[9px] font-medium text-gray-400 dark:text-slate-600 mt-1">
                                            {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-gray-50 dark:bg-slate-800/30 rounded-3xl p-8 space-y-6">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Category</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{request.category}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Severity</p>
                            <p className={`text-sm font-bold ${severityColors[request.severity]}`}>{request.severity}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Location</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{request.where_did_it_happen}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
