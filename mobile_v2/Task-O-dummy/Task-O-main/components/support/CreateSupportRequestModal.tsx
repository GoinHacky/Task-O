'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Upload, ChevronDown, X } from 'lucide-react'
import { submitSupportRequest } from '@/lib/support/actions'
import Modal from '@/components/ui/Modal'

const categories = ['Bug', 'UI Issue', 'Performance', 'Suggestion', 'Other']
const pages = ['Dashboard', 'Boards', 'Tasks', 'Inbox', 'Login', 'Settings', 'Other']
const severities = ['Low', 'Medium', 'High', 'Critical']

export default function CreateSupportRequestModal({
    isOpen,
    onClose,
    onSuccess
}: {
    isOpen: boolean,
    onClose: () => void,
    onSuccess?: (ticketId: string) => void
}) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [ticketId, setTicketId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        category: 'Bug',
        where_did_it_happen: 'Dashboard',
        severity: 'Medium',
        description: '',
        steps_to_reproduce: '',
        expected_result: '',
        screenshot_url: '',
    })

    const [browserInfo, setBrowserInfo] = useState<any>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBrowserInfo({
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: (navigator as any).platform,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
            })
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitting) return

        setIsSubmitting(true)
        setError(null)
        try {
            const result = await submitSupportRequest({
                ...formData,
                page_url: window.location.href,
                browser_info: browserInfo
            })
            if (result.success) {
                setSuccess(true)
                setTicketId(result.ticket_id!)
                if (onSuccess) onSuccess(result.ticket_id!)

                // Close after a delay if successful
                setTimeout(() => {
                    handleClose()
                }, 3000)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit request.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setSuccess(false)
        setTicketId(null)
        setError(null)
        setFormData({
            title: '',
            category: 'Bug',
            where_did_it_happen: 'Dashboard',
            severity: 'Medium',
            description: '',
            steps_to_reproduce: '',
            expected_result: '',
            screenshot_url: '',
        })
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="New Support Request"
            helperText="Report issues or send feedback to help us improve"
            footer={
                !success && (
                    <>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-900 transition-all border-r border-gray-100 dark:border-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.title || !formData.description}
                            className="flex-1 py-4 text-[10px] font-black text-[#0077B6] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </>
                )
            }
        >
            {success ? (
                <div className="py-12 text-center animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-3xl bg-green-50 dark:bg-green-500/10 text-green-500 mb-6 border border-green-100 dark:border-green-500/20">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-slate-50 uppercase tracking-tight mb-2">Submitted Successfully</h3>
                    <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">
                        Reference ID: <span className="text-[#0077B6]">{ticketId}</span>
                    </p>
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 max-w-[240px] mx-auto">
                        Our team will review your request and get back to you shortly.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-start gap-3 text-red-600 animate-in slide-in-from-top-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</span>
                        </div>
                    )}

                    <div className="space-y-5">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Title *</label>
                            <input
                                autoFocus
                                required
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-[#0077B6]/5 focus:border-[#0077B6] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-100 placeholder:text-gray-400"
                                placeholder="Short summary of the issue..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Category */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Category</label>
                                <div className="relative">
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-[#0077B6]/5 focus:border-[#0077B6] outline-none transition-all text-xs font-black uppercase tracking-widest text-gray-900 dark:text-slate-100 appearance-none cursor-pointer"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Location</label>
                                <div className="relative">
                                    <select
                                        value={formData.where_did_it_happen}
                                        onChange={(e) => setFormData({ ...formData, where_did_it_happen: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-[#0077B6]/5 focus:border-[#0077B6] outline-none transition-all text-xs font-black uppercase tracking-widest text-gray-900 dark:text-slate-100 appearance-none cursor-pointer"
                                    >
                                        {pages.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Severity */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Severity</label>
                            <div className="grid grid-cols-4 gap-2">
                                {severities.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, severity: s })}
                                        className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${formData.severity === s
                                                ? 'bg-[#0077B6] border-[#0077B6] text-white shadow-lg shadow-blue-500/10'
                                                : 'bg-gray-50/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 hover:border-[#0077B6]/30'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description *</label>
                            <textarea
                                required
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-3xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-[#0077B6]/5 focus:border-[#0077B6] outline-none transition-all text-sm font-bold text-gray-600 dark:text-slate-400 resize-none h-32 placeholder:font-medium"
                                placeholder="Detailed operational intelligence regarding the issue..."
                            />
                        </div>

                        {/* Additional info toggle (optional) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Steps (Optional)</label>
                                <textarea
                                    rows={2}
                                    value={formData.steps_to_reproduce}
                                    onChange={(e) => setFormData({ ...formData, steps_to_reproduce: e.target.value })}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#0077B6]/10 focus:border-[#0077B6] outline-none transition-all text-xs font-medium text-gray-500 dark:text-slate-500 resize-none h-20"
                                    placeholder="Steps to replicate..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Expected (Optional)</label>
                                <textarea
                                    rows={2}
                                    value={formData.expected_result}
                                    onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#0077B6]/10 focus:border-[#0077B6] outline-none transition-all text-xs font-medium text-gray-500 dark:text-slate-500 resize-none h-20"
                                    placeholder="Outcome expected..."
                                />
                            </div>
                        </div>

                        {/* Screenshot Placeholder */}
                        <div className="pt-2">
                            <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl group hover:border-[#0077B6]/30 transition-all cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-gray-400 group-hover:text-[#0077B6] transition-colors">
                                    <Upload size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest">Screenshot</p>
                                    <p className="text-[9px] font-medium text-gray-400 dark:text-slate-500">Optional visualization</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    )
}
