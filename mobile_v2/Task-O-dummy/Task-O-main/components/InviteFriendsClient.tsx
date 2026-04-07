'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    UserPlus,
    Mail,
    Send,
    ChevronRight
} from 'lucide-react'

interface InviteFriendsClientProps {
    user: any
}

export default function InviteFriendsClient({ user }: InviteFriendsClientProps) {
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviting, setInviting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setInviting(true)
        setMessage(null)

        // Simulate invitation logic
        setTimeout(() => {
            setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}!` })
            setInviteEmail('')
            setInviting(false)
        }, 1000)
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-gray-300 dark:border-slate-800 shadow-xl shadow-gray-100/50 dark:shadow-none min-h-[600px] overflow-hidden flex flex-col">

                    {message && (
                        <div className={`p-10 py-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'} border-b font-bold text-xs flex items-center gap-3 animate-in slide-in-from-top duration-300`}>
                            <div className={`w-6 h-6 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white flex items-center justify-center shrink-0`}>
                                {message.type === 'success' ? '✓' : '!'}
                            </div>
                            {message.text}
                        </div>
                    )}

                    <div className="p-10 md:p-14 flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="mb-10">
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tightest mb-2">Invite Friends</h1>
                            <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">Scale your workflow with more hands</p>
                        </div>

                        <div className="bg-[#f3f4ff] dark:bg-emerald-500/5 rounded-[40px] p-10 mb-12 flex flex-col md:flex-row items-center gap-10 border border-gray-300 dark:border-emerald-500/10">
                            <div className="w-48 h-48 bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl dark:shadow-none flex items-center justify-center relative group">
                                <div className="absolute inset-4 bg-indigo-50 dark:bg-emerald-500/10 rounded-[32px] flex items-center justify-center text-indigo-500 dark:text-emerald-500 group-hover:scale-110 transition-transform duration-500">
                                    <UserPlus size={48} strokeWidth={2.5} />
                                </div>
                                <div className="absolute -top-2 -right-2 w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                                    <div className="font-black text-xs">FREE</div>
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Invite 3 friends, get Pro free for a month!</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-medium mb-0">Help us grow Task-O and we&apos;ll reward you with premium features. It&apos;s a win-win for everyone.</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Send Invitation</label>
                                <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-950/50 border border-gray-300 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm font-bold text-gray-900 dark:text-white shadow-inner focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500"
                                            placeholder="friend@example.com"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={inviting}
                                        className="px-10 py-4 bg-emerald-500 text-white text-[11px] font-black rounded-[20px] hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3"
                                    >
                                        {inviting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Send size={16} />
                                        )}
                                        Send Invite
                                    </button>
                                </form>
                            </div>

                            <div className="pt-8 border-t border-gray-300 dark:border-slate-800">
                                <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-6">Share Referral Link</h4>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-950/50 border border-gray-300 dark:border-slate-800 rounded-2xl">
                                    <div className="flex-1 truncate text-xs font-bold text-gray-500 dark:text-slate-400 ml-2">
                                        tasko.app/join?ref={user.id.slice(0, 8)}
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`tasko.app/join?ref=${user.id.slice(0, 8)}`)
                                            setMessage({ type: 'success', text: 'Referral link copied to clipboard!' })
                                        }}
                                        className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-700 transition-all text-gray-600 dark:text-gray-300"
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
