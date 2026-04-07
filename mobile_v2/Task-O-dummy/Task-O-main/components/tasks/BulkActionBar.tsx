'use client'

import { useState } from 'react'
import {
    Trash2,
    MoreHorizontal,
    X,
    CheckCircle2,
    Clock,
    RefreshCw,
    AlertCircle
} from 'lucide-react'
import { bulkUpdateTaskStatus, bulkDeleteTasks } from '@/lib/tasks/actions'

interface BulkActionBarProps {
    selectedIds: string[]
    projectId: string
    onClear: () => void
    onSuccess: () => void
}

export default function BulkActionBar({ selectedIds, projectId, onClear, onSuccess }: BulkActionBarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleBulkStatusUpdate = async (status: string) => {
        setLoading(true)
        try {
            await bulkUpdateTaskStatus(selectedIds, status, projectId)
            onSuccess()
        } catch (error) {
            console.error('Bulk update failed:', error)
        } finally {
            setLoading(false)
            setIsMenuOpen(false)
        }
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} tasks?`)) return

        setLoading(true)
        try {
            await bulkDeleteTasks(selectedIds, projectId)
            onSuccess()
        } catch (error) {
            console.error('Bulk delete failed:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-[32px] shadow-2xl px-6 py-4 flex items-center gap-6 border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                    <div className="w-8 h-8 rounded-full bg-[#6366f1] text-white flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-500/20">
                        {selectedIds.length}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Tasks Selected</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleBulkStatusUpdate('in_progress')}
                        disabled={loading}
                        className="p-3 rounded-2xl hover:bg-white/10 text-white/80 hover:text-white transition-all group flex items-center gap-2"
                        title="Start Selection"
                    >
                        <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Start</span>
                    </button>

                    <button
                        onClick={() => handleBulkStatusUpdate('review')}
                        disabled={loading}
                        className="p-3 rounded-2xl hover:bg-white/10 text-white/80 hover:text-white transition-all group flex items-center gap-2"
                        title="Move to Review"
                    >
                        <Clock size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Review</span>
                    </button>

                    <button
                        onClick={() => handleBulkStatusUpdate('completed')}
                        disabled={loading}
                        className="p-3 rounded-2xl hover:bg-white/10 text-white/80 hover:text-white transition-all group flex items-center gap-2"
                        title="Compelete Selection"
                    >
                        <CheckCircle2 size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Done</span>
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-2" />

                    <button
                        onClick={handleBulkDelete}
                        disabled={loading}
                        className="p-3 rounded-2xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all flex items-center gap-2"
                        title="Delete Selection"
                    >
                        <Trash2 size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline text-red-300">Delete</span>
                    </button>
                </div>

                <div className="flex items-center pl-6 border-l border-white/10">
                    <button
                        onClick={onClear}
                        className="w-10 h-10 rounded-full hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    )
}
