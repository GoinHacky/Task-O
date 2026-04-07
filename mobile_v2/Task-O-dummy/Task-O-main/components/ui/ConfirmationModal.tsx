import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    type?: 'danger' | 'info' | 'warning'
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    type = 'danger'
}: ConfirmationModalProps) {
    const confirmButtonColors = {
        danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white',
        info: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20 text-white',
        warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white'
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/20"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm()
                            onClose()
                        }}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${confirmButtonColors[type]}`}
                    >
                        {confirmLabel}
                    </button>
                </>
            }
        >
            <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border-2 ${type === 'danger' ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-500' :
                        type === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-500' :
                            'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-500'
                    }`}>
                    <AlertTriangle size={32} />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400 leading-relaxed">
                    {message}
                </p>
            </div>
        </Modal>
    )
}
