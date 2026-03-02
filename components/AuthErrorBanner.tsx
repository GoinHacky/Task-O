'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

export default function AuthErrorBanner() {
    const [error, setError] = useState<{ title: string; message: string } | null>(null)

    useEffect(() => {
        const handleHash = () => {
            const hash = window.location.hash
            if (!hash || !hash.startsWith('#error=')) return

            const params = new URLSearchParams(hash.substring(1))
            const errorCode = params.get('error_code')
            const errorDescription = params.get('error_description')

            if (errorCode || errorDescription) {
                let title = 'Authentication Error'
                let message = errorDescription || 'An unexpected error occurred during authentication.'

                if (errorCode === 'otp_expired') {
                    title = 'Link Expired'
                    message = 'The security link has expired or has already been used. Please request a new one.'
                } else if (errorCode === 'access_denied') {
                    title = 'Access Denied'
                }

                setError({ title, message })

                // Clean up the hash to prevent the error from showing again on refresh
                // but keep the history state
                const newUrl = window.location.pathname + window.location.search
                window.history.replaceState(null, '', newUrl)
            }
        }

        handleHash()
        window.addEventListener('hashchange', handleHash)
        return () => window.removeEventListener('hashchange', handleHash)
    }, [])

    if (!error) return null

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 shadow-2xl flex items-start gap-4 ring-1 ring-red-500/10">
                <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-500 shrink-0">
                    <AlertCircle size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">
                        {error.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-medium">
                        {error.message}
                    </p>
                </div>
                <button
                    onClick={() => setError(null)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}
