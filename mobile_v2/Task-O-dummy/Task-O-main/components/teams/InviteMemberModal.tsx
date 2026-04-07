'use client'

import { useState } from 'react'
import { inviteMember } from '@/lib/teams/actions'
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'

export default function InviteMemberModal({ teamId }: { teamId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'admin' | 'member'>('member')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)
        setError(null)
        try {
            const result = await inviteMember(teamId, email, role)
            if (result?.error) {
                setError(result.error)
                return
            }
            setSuccess(true)
            setEmail('')
            setTimeout(() => {
                setSuccess(false)
                setIsOpen(false)
            }, 3000)
        } catch (err: any) {
            console.error('Client-side error in Team InviteMemberModal:', err)
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full mt-2 py-4 bg-gray-50 dark:bg-slate-800/50 hover:bg-[#6366f1]/5 text-[10px] font-black text-gray-400 hover:text-[#6366f1] uppercase tracking-widest rounded-2xl transition-all border border-transparent hover:border-[#6366f1]/20 shadow-sm"
            >
                <UserPlus className="h-4 w-4 mr-2 inline-block" />
                Invite Member
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Invite New Member"
            >
                {success ? (
                    <div className="py-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Invitation Sent!</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            We&apos;ve sent an invitation to join your team.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-2 text-red-600 animate-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                            <input
                                autoFocus
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-900"
                                placeholder="name@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Role</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('member')}
                                    className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${role === 'member'
                                        ? 'bg-primary-50 border-primary-200 text-primary-700 ring-2 ring-primary-500/20'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    Member
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('admin')}
                                    className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${role === 'admin'
                                        ? 'bg-primary-50 border-primary-200 text-primary-700 ring-2 ring-primary-500/20'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    Admin
                                </button>
                            </div>
                            <p className="mt-2 text-[11px] text-gray-500 italic">
                                {role === 'admin'
                                    ? 'Admins can manage team settings and invite others.'
                                    : 'Members can access and contribute to all team projects.'}
                            </p>
                        </div>
                        <div className="flex space-x-3 pt-4 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                            >
                                {loading ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    )
}
