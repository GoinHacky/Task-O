'use client'

import { AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'

interface DeleteTeamModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    teamName: string
    loading?: boolean
}

export default function DeleteTeamModal({ isOpen, onClose, onConfirm, teamName, loading }: DeleteTeamModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Delete Team"
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
                    Verify permanent deletion of team <span className="text-rose-500">{teamName.toUpperCase()}</span>?
                </p>
                <p className="mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    This operation is non-reversible and will remove all members from this team.
                </p>
            </div>
        </Modal>
    )
}
