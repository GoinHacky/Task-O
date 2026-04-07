'use client'

import { useState } from 'react'
import { inviteProjectMember } from '@/lib/projects/actions'
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'

export default function InviteProjectMemberModal({ projectId }: { projectId: string }) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'admin' | 'manager' | 'member'>('member')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)
        setError(null)
        try {
            const result = await inviteProjectMember(projectId, email, role)
            if (result?.error) {
                setError(result.error)
                return
            }
            setSuccess(true)
            setEmail('')
            router.refresh()
            setTimeout(() => {
                setSuccess(false)
                setIsOpen(false)
            }, 3000)
        } catch (err: any) {
            console.error('Client-side error in InviteProjectMemberModal:', err)
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center px-6 py-2.5 bg-[#6366f1] text-white rounded-xl font-medium hover:bg-[#5558e3] transition-all flex items-center gap-2 shadow-lg shadow-[#6366f1]/20 active:scale-95"
            >
                <UserPlus size={18} />
                Invite Member
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Invite to Project"
            >
                {success ? (
                    <div className="py-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Member Added!</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            The user has been added to the project.
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
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] outline-none transition-all text-gray-900"
                                placeholder="name@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Role</label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['member', 'manager', 'admin'] as const).map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${role === r
                                            ? 'bg-[#f3f4ff] border-[#6366f1] text-[#6366f1] ring-2 ring-[#6366f1]/10'
                                            : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex space-x-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-sm font-bold text-gray-400 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-[#6366f1] text-white text-sm font-bold rounded-xl hover:bg-[#5558e3] disabled:opacity-50 transition-all shadow-lg shadow-[#6366f1]/20 active:scale-95"
                            >
                                {loading ? 'Adding...' : 'Add Member'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    )
}
