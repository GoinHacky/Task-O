'use client'

import { AlertTriangle, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'

interface DeleteProjectModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    projectName: string
    loading?: boolean
}

export default function DeleteProjectModal({ isOpen, onClose, onConfirm, projectName, loading }: DeleteProjectModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Delete Project"
            helperText="Permanent removal of data"
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
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Delete'}
                    </button>
                </>
            }
        >
            <div className="text-center py-6">
                <p className="text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-[0.2em] leading-relaxed">
                    Verify permanent deletion of <span className="text-rose-500">{projectName.toUpperCase()}</span>?
                </p>
                <p className="mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    This operation is non-reversible
                </p>
            </div>
        </Modal>
    )
}
