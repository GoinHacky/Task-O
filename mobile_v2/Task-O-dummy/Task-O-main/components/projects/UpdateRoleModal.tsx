'use client'

import { useState } from 'react'
import { Shield, CheckCircle2, AlertCircle, User, Zap, Lock, Eye } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface UpdateRoleModalProps {
    isOpen: boolean
    onClose: () => void
    member: {
        id: string
        user_id: string
        full_name: string
        email: string
        role: string
    }
    projectId: string
}

export default function UpdateRoleModal({ isOpen, onClose, member, projectId }: UpdateRoleModalProps) {
    const router = useRouter()
    const [role, setRole] = useState(member.role)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)
        setError(null)

        try {
            const { error: updateError } = await supabase
                .from('project_members')
                .update({ role })
                .eq('id', member.id)

            if (updateError) throw updateError

            setSuccess(true)
            setTimeout(() => {
                setSuccess(false)
                onClose()
                router.refresh()
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Access modification failed.')
        } finally {
            setLoading(false)
        }
    }

    const roles = [
        { id: 'admin', label: 'Admin', desc: 'Full administrative control over this project.', icon: Shield, color: 'text-rose-500', bg: 'bg-rose-50' },
        { id: 'member', label: 'Member', desc: 'Can create and edit tasks, members, and project data.', icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { id: 'viewer', label: 'Viewer', desc: 'Read-only access to tasks and project overview.', icon: Eye, color: 'text-gray-500', bg: 'bg-gray-50' },
    ]

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Update Member Role"
        >
            {success ? (
                <div className="py-12 text-center animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-indigo-50 text-indigo-500 mb-6 shadow-sm border border-indigo-100">
                        <Lock className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tightest">Role Updated</h3>
                    <p className="mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                        Permissions updated for {member.full_name || member.email}.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8 max-w-[460px] mx-auto">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600 animate-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-3xl border border-gray-100">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-lg font-black text-indigo-500 shadow-sm">
                            {member.full_name?.[0] || member.email?.[0] || 'U'}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Project Member</p>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tightest">{member.full_name || 'User'}</h4>
                            <p className="text-[10px] font-bold text-gray-400 lowercase">{member.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Select New Role</label>
                        <div className="space-y-3">
                            {roles.map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setRole(r.id)}
                                    className={`w-full flex items-start gap-4 p-5 rounded-[28px] border transition-all text-left group ${role === r.id
                                        ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-500/5 ring-1 ring-indigo-500/10'
                                        : 'bg-transparent border-gray-100/60 hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${role === r.id ? r.bg + ' ' + r.color : 'bg-gray-50 text-gray-400'}`}>
                                        <r.icon size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${role === r.id ? 'text-gray-900' : 'text-gray-400'}`}>{r.label}</p>
                                            {role === r.id && (
                                                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                                                    <CheckCircle2 size={12} />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight">{r.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-4 border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || role === member.role}
                            className="flex-1 px-4 py-4 bg-gray-900 text-white text-[10px] font-black rounded-2xl hover:bg-black disabled:opacity-50 transition-all shadow-xl shadow-gray-900/10 active:scale-95 uppercase tracking-[0.2em]"
                        >
                            {loading ? 'Updating...' : 'Update Role'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    )
}
