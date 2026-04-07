import Link from 'next/link'
import { format } from 'date-fns'

interface SupportRequest {
    id: string
    ticket_id: string
    title: string
    category: string
    severity: string
    status: string
    created_at: string
}

const statusColors: Record<string, string> = {
    'Open': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'Reviewed': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Resolved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Closed': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
}

const severityColors: Record<string, string> = {
    'Low': 'text-gray-500',
    'Medium': 'text-blue-500',
    'High': 'text-orange-500',
    'Critical': 'text-red-500 font-bold',
}

export default function SupportCard({ request }: { request: SupportRequest }) {
    return (
        <Link href={`/support/${request.id}`}>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">
                            {request.ticket_id}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-[#0077B6] transition-colors">
                            {request.title}
                        </h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColors[request.status] || statusColors['Open']}`}>
                        {request.status}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1">Category</p>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{request.category}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1">Severity</p>
                        <p className={`text-xs font-bold ${severityColors[request.severity] || 'text-gray-700'}`}>{request.severity}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1">Submitted</p>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {format(new Date(request.created_at), 'MMM dd, yyyy')}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    )
}
