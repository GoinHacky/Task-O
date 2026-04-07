'use client'

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import { format, subDays, isAfter, startOfDay } from 'date-fns'

const COLORS = ['#0077B6', '#0096C7', '#00B4D8', '#48CAE4', '#90E0EF']
const SEVERITY_COLORS = {
    'Low': '#94a3b8',
    'Medium': '#0077B6',
    'High': '#f59e0b',
    'Critical': '#ef4444'
}

export default function SupportAnalyticsCharts({ requests }: { requests: any[] }) {
    // 1. Category Chart Data
    const categoryData = requests.reduce((acc: any[], req) => {
        const existing = acc.find(item => item.name === req.category)
        if (existing) existing.value++
        else acc.push({ name: req.category, value: 1 })
        return acc
    }, [])

    // 2. Severity Chart Data
    const severityData = requests.reduce((acc: any[], req) => {
        const existing = acc.find(item => item.name === req.severity)
        if (existing) existing.value++
        else acc.push({ name: req.severity, value: 1 })
        return acc
    }, [])

    // 3. Last 30 Days Trend
    const thirtyDaysAgo = subDays(new Date(), 30)
    const trendData = []
    for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStr = format(date, 'MMM dd')
        const count = requests.filter(req => {
            const reqDate = new Date(req.created_at)
            return format(reqDate, 'MMM dd') === dateStr && isAfter(reqDate, thirtyDaysAgo)
        }).length
        trendData.push({ date: dateStr, count })
    }

    // 4. Top Reported Pages
    const pageData = requests.reduce((acc: any[], req) => {
        const page = req.where_did_it_happen || 'Unknown'
        const existing = acc.find(item => item.name === page)
        if (existing) existing.value++
        else acc.push({ name: page, value: 1 })
        return acc
    }, []).sort((a: any, b: any) => b.value - a.value).slice(0, 5)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trend Chart */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 lg:col-span-2">
                <h3 className="text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-8">Requests Trend (Last 30 Days)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 800, color: '#0077B6' }}
                            />
                            <Line type="monotone" dataKey="count" stroke="#0077B6" strokeWidth={4} dot={{ r: 4, fill: '#0077B6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Chart */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8">
                <h3 className="text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-8">Requests by Category</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={100} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                            <Bar dataKey="value" fill="#0077B6" radius={[0, 10, 10, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Severity Chart */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8">
                <h3 className="text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-8">Requests by Severity</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={severityData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {severityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={(SEVERITY_COLORS as any)[entry.name] || '#cbd5e1'} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                            <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{value}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Pages */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 lg:col-span-2">
                <h3 className="text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-8">Top Reported Pages</h3>
                <div className="space-y-4">
                    {pageData.map((page, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <span className="w-24 text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">{page.name}</span>
                            <div className="flex-1 h-3 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#0077B6] rounded-full transition-all duration-1000"
                                    style={{ width: `${(page.value / requests.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-black text-gray-900 dark:text-white">{page.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
