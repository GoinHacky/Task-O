'use client'

import { useState } from 'react'
import { Trash2, X, AlertTriangle } from 'lucide-react'

interface DeleteTaskModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    taskTitle: string
    loading?: boolean
}

export default function DeleteTaskModal({ isOpen, onClose, onConfirm, taskTitle, loading }: DeleteTaskModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300 w-full h-full p-4 overflow-y-auto overflow-x-hidden">
            <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-[24px] flex items-center justify-center text-red-500 mx-auto mb-8">
                        <AlertTriangle size={32} />
                    </div>

                    <h2 className="text-[20px] font-black text-gray-900 dark:text-slate-50 tracking-tightest leading-none uppercase mb-4">Delete Task</h2>
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-relaxed mb-10 italic px-4">
                        You are about to permanently delete <span className="text-red-500">{taskTitle.toUpperCase()}</span>. This action cannot be undone.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="w-full px-8 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Delete Forever'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full px-8 py-4 bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                        >
                            Keep Task
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
