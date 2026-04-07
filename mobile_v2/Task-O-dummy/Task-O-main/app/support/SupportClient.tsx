'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import SupportCard from '@/components/support/SupportCard'
import CreateSupportRequestModal from '@/components/support/CreateSupportRequestModal'
import { useRouter } from 'next/navigation'

export default function SupportClient({ requests, user }: { requests: any[], user: any }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const router = useRouter()

    const handleSuccess = (ticketId: string) => {
        router.refresh()
    }

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-0 py-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                        Support
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 font-medium">
                        Report issues or send feedback to help us improve the platform.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0077B6] hover:bg-[#005F92] text-white font-black rounded-2xl transition-all shadow-lg active:scale-95 shrink-0"
                >
                    <Plus size={20} />
                    New Support Request
                </button>
            </div>

            <div className="space-y-6">
                <h2 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    My Support Requests
                </h2>

                {!requests || requests.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-300 mb-6 font-black text-3xl">
                            ?
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            You haven&apos;t submitted any support requests yet.
                        </h3>
                        <p className="text-gray-500 dark:text-slate-400 max-w-sm">
                            If you encounter any bugs or have suggestions for improvement, we&apos;re here to help!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {requests.map((request) => (
                            <SupportCard key={request.id} request={request} />
                        ))}
                    </div>
                )}
            </div>

            <CreateSupportRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
