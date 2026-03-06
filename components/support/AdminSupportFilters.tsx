'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'

export default function AdminSupportFilters({ statuses }: { statuses: string[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentStatus = searchParams.get('status') || ''

    const handleStatusChange = (status: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (status) params.set('status', status)
        else params.delete('status')
        router.push(`/admin/support?${params.toString()}`)
    }

    return (
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 px-3 py-2 text-gray-400">
                <Filter size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
            </div>
            <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
            >
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
    )
}
