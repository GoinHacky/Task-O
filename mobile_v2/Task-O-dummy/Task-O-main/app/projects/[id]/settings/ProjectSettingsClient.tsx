'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProject } from '@/lib/projects/actions'
import DeleteProjectButton from '@/components/DeleteProjectButton'
import { Trash2, Shield, Settings, Info, Save, Globe, Code, Zap } from 'lucide-react'

interface ProjectSettingsClientProps {
    project: any
}

type Tab = 'general' | 'roles' | 'integrations' | 'danger'

export default function ProjectSettingsClient({ project }: ProjectSettingsClientProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<Tab>('general')
    const [name, setName] = useState(project.name)
    const [description, setDescription] = useState(project.description || '')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'roles', label: 'Roles & Access', icon: Shield },
        { id: 'integrations', label: 'Integrations', icon: Zap },
        { id: 'danger', label: 'Danger Zone', icon: Trash2 },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await updateProject(project.id, name, description)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex gap-12 animate-in fade-in duration-500 pb-32">
            {/* Settings Nav */}
            <div className="w-64 space-y-1">
                <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 px-4">Configuration</h3>
                {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${activeTab === tab.id
                                ? 'bg-[#f3f4ff] dark:bg-indigo-500/10 text-[#6366f1] font-black'
                                : 'text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 font-bold'}`}
                        >
                            <Icon size={18} className={activeTab === tab.id ? 'text-[#6366f1]' : 'text-gray-400 group-hover:text-gray-600'} />
                            <span className="text-xs uppercase tracking-widest leading-none mt-0.5">{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 max-w-3xl">
                {activeTab === 'general' && (
                    <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div>
                                <h3 className="text-[18px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-tightest mb-8">General Information</h3>
                                <div className="grid grid-cols-1 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Project Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-6 py-4 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-[#6366f1]/5 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-50 shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Project Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={6}
                                            className="w-full px-6 py-4 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-[#6366f1]/5 focus:border-[#6366f1] outline-none transition-all text-sm font-bold text-gray-900 dark:text-slate-50 shadow-inner resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-8 border-t border-gray-50 dark:border-slate-800/50">
                                <button
                                    type="submit"
                                    disabled={loading || (name === project.name && description === project.description)}
                                    className="px-10 py-4 bg-[#6366f1] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5558e3] disabled:opacity-50 transition-all flex items-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-95"
                                >
                                    <Save size={16} />
                                    {loading ? 'Saving...' : success ? 'Settings Updated' : 'Push Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'roles' && (
                    <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
                        <h3 className="text-[18px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-tightest mb-8">Access Logic</h3>
                        <div className="space-y-6">
                            {[
                                { name: 'Administrative Access', desc: 'Full control over project configuration and personnel.', active: true },
                                { name: 'Standard Contribution', desc: 'Create, edit, and manage tasks within assigned boards.', active: true },
                                { name: 'Read-only Observation', desc: 'View-only access for stakeholders and reports.', active: false },
                            ].map((role, i) => (
                                <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50/50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${role.active ? 'bg-indigo-50 text-[#6366f1] dark:bg-indigo-500/10' : 'bg-gray-100 text-gray-400 dark:bg-slate-800'}`}>
                                            <Shield size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-widest">{role.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold italic">{role.desc}</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${role.active ? 'bg-[#6366f1]' : 'bg-gray-200 dark:bg-slate-800'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${role.active ? 'right-1' : 'left-1'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'integrations' && (
                    <div className="bg-white dark:bg-slate-900/40 p-20 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-sm backdrop-blur-xl flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-[24px] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#6366f1] mb-6">
                            <Globe size={32} />
                        </div>
                        <h3 className="text-[18px] font-black text-gray-900 dark:text-slate-50 uppercase tracking-tightest">External Connectivity</h3>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-4 max-w-xs font-medium italic leading-relaxed">
                            Webhooks and API integrations are currently restricted to the Enterprise tier.
                        </p>
                    </div>
                )}

                {activeTab === 'danger' && (
                    <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[40px] border border-red-100 dark:border-red-900/20 shadow-sm backdrop-blur-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Trash2 size={120} className="text-red-500" />
                        </div>

                        <h3 className="text-[18px] font-black text-red-500 uppercase tracking-tightest mb-8">Danger Zone</h3>
                        <div className="p-10 border-2 border-dashed border-red-100 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5 rounded-[32px] space-y-8">
                            <div>
                                <h4 className="text-[13px] font-black text-red-900 dark:text-red-400 uppercase tracking-widest mb-2">Project Deletion</h4>
                                <p className="text-[11px] text-red-700 dark:text-red-400/60 leading-relaxed font-bold italic">
                                    All data, tasks, and historical records for this project will be permanently removed. This action is irreversible.
                                </p>
                            </div>
                            <DeleteProjectButton projectId={project.id} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
