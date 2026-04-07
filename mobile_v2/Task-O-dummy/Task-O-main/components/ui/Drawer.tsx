'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

export default function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
    const drawerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        if (isOpen) {
            document.body.style.overflow = 'hidden'
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.body.style.overflow = 'unset'
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, onClose])

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-[-100px] bg-slate-950/40 backdrop-blur-md z-[60] transition-opacity duration-300 animate-in fade-in"
                    onClick={onClose}
                />
            )}

            {/* Drawer/Modal Container */}
            <div
                ref={drawerRef}
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[560px] max-h-[90vh] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[70] rounded-[32px] transition-all duration-300 ease-out flex flex-col overflow-hidden ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                    }`}
            >
                <div className="flex flex-col min-h-0 max-h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 px-8 border-b border-gray-50 dark:border-slate-800/50 shrink-0">
                        <div>
                            <h2 className="text-xs font-black text-gray-900 dark:text-slate-50 uppercase tracking-widest">{title}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 pt-4 pb-12 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
                        {children}
                    </div>
                </div>
            </div>
        </>
    )
}
