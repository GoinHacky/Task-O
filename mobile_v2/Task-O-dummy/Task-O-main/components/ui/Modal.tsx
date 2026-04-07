'use client'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import Portal from './Portal'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    helperText?: string
    children: React.ReactNode
    footer?: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, helperText, children, footer }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        if (isOpen) {
            document.body.style.overflow = 'hidden'
            window.addEventListener('keydown', handleEsc)
        }

        return () => {
            document.body.style.overflow = 'unset'
            window.removeEventListener('keydown', handleEsc)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-slate-800/50 max-w-[480px] w-full max-h-[calc(100vh-40px)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="px-8 pt-10 pb-6 text-center border-b border-gray-50/50 dark:border-slate-800/10 shrink-0 relative">
                        <button
                            onClick={onClose}
                            className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-black text-gray-900 dark:text-slate-50 tracking-tight">{title}</h2>
                        {helperText && (
                            <p className="mt-1.5 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{helperText}</p>
                        )}
                    </div>

                    <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                        {children}
                    </div>

                    {footer && (
                        <div className="flex border-t border-gray-50 dark:border-slate-800/50 relative shrink-0">
                            {footer}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-50 dark:bg-slate-800/50" />
                        </div>
                    )}
                </div>
            </div>
        </Portal>
    )
}
