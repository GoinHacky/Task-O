'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/lib/projects/actions'
import { FolderPlus, CheckCircle2, AlertCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess?: () => void }) {
    const router = useRouter()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState('planning')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)
        setError(null)
        try {
            const project = await createProject({
                name,
                description,
                status,
                start_date: startDate || undefined,
                end_date: endDate || undefined
            })
            setSuccess(true)
            setName('')
            setDescription('')
            setStatus('planning')
            setStartDate('')
            setEndDate('')
            setTimeout(() => {
                setSuccess(false)
                onClose()
                if (onSuccess) onSuccess()
                router.push(`/projects/${project.id}`)
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Project"
            helperText="Define your project scope and timeline"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-900 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !name}
                        className="flex-1 py-4 text-[10px] font-black text-[#6366f1] uppercase tracking-[0.2em] hover:bg-gray-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Project'}
                    </button>
                </>
            }
        >
            {success ? (
                <div className="py-8 text-center animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-50 text-emerald-500 mb-4 border border-emerald-100 shadow-sm">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-slate-50 uppercase tracking-tight">Project Created</h3>
                    <p className="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Project created successfully
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-600 animate-in slide-in-from-top-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Project Name *</label>
                            <input
                                autoFocus
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-[#6366f1]/5 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-100 placeholder:font-medium shadow-inner"
                                placeholder="Project Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-[#6366f1]/5 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-600 dark:text-slate-400 h-24 resize-none placeholder:font-medium shadow-inner"
                                placeholder="Outline the purpose and scope..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-[#6366f1]/5 focus:border-[#6366f1] outline-none transition-all text-xs font-bold text-gray-900 dark:text-slate-100 shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-[#6366f1]/5 focus:border-[#6366f1] outline-none transition-all text-xs font-bold text-gray-900 dark:text-slate-100 shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Project Status</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'planning', label: 'Planning', color: 'bg-amber-500' },
                                    { id: 'active', label: 'Active', color: 'bg-emerald-500' },
                                    { id: 'archived', label: 'Archived', color: 'bg-gray-500' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setStatus(item.id)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${status === item.id
                                            ? 'bg-white dark:bg-slate-800 border-[#6366f1] ring-4 ring-[#6366f1]/5 shadow-sm'
                                            : 'bg-gray-50/50 dark:bg-slate-900/50 border-transparent hover:border-gray-200 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${item.color} shadow-sm`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${status === item.id ? 'text-[#6366f1]' : 'text-gray-400'}`}>
                                            {item.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    )
}
