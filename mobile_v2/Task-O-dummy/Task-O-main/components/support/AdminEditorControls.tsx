'use client'

import { updateSupportStatus, updateSupportSeverity } from '@/lib/support/actions'
import { useState } from 'react'

export function StatusSelect({ requestId, initialValue, statuses }: { requestId: string, initialValue: string, statuses: string[] }) {
    const [loading, setLoading] = useState(false)

    const handleChange = async (newStatus: string) => {
        setLoading(true)
        try {
            await updateSupportStatus(requestId, newStatus)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <select
            value={initialValue}
            onChange={(e) => handleChange(e.target.value)}
            disabled={loading}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-[#0077B6]/10 disabled:opacity-50 cursor-pointer"
        >
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
    )
}

export function SeveritySelect({ requestId, initialValue }: { requestId: string, initialValue: string }) {
    const [loading, setLoading] = useState(false)
    const severities = ['Low', 'Medium', 'High', 'Critical']

    const handleChange = async (newSeverity: string) => {
        setLoading(true)
        try {
            await updateSupportSeverity(requestId, newSeverity)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <select
            value={initialValue}
            onChange={(e) => handleChange(e.target.value)}
            disabled={loading}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-[#0077B6]/10 disabled:opacity-50 cursor-pointer"
        >
            {severities.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
    )
}

export function AdminActionButtons({ requestId }: { requestId: string }) {
    const [loading, setLoading] = useState(false)

    const handleAction = async (status: string) => {
        setLoading(true)
        try {
            await updateSupportStatus(requestId, status)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-4">
            <button
                disabled={loading}
                onClick={() => handleAction('Resolved')}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl transition-all shadow-lg active:scale-95 text-xs disabled:opacity-50"
            >
                Mark Resolved
            </button>
            <button
                disabled={loading}
                onClick={() => handleAction('Closed')}
                className="px-6 py-3 bg-gray-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white font-black rounded-xl transition-all shadow-lg active:scale-95 text-xs disabled:opacity-50"
            >
                Close Request
            </button>
        </div>
    )
}
