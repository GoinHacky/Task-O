'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    HelpCircle,
    ChevronRight,
    MessageSquare,
    Send,
    LifeBuoy,
    Play
} from 'lucide-react'
import CreateSupportRequestModal from '@/components/support/CreateSupportRequestModal'
import TutorialModal from '@/components/TutorialModal'

interface HelpSupportClientProps {
    user: any
}

export default function HelpSupportClient({ user }: HelpSupportClientProps) {
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
    const [isTutorialOpen, setIsTutorialOpen] = useState(false)
    const [showTutorialGlow, setShowTutorialGlow] = useState(false)

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-gray-300 dark:border-slate-800 shadow-xl shadow-gray-100/50 dark:shadow-none min-h-[600px] overflow-hidden flex flex-col">
                    <div className="p-10 md:p-14 flex-1 animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
                        <div className="mb-10">
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tightest mb-2">Help & Support</h1>
                            <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">We&apos;re here to help you succeed</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="p-8 rounded-[32px] border border-gray-300 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6">
                                    <MessageSquare size={24} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-3">Live Chat</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed mb-6">Chat with our team in real-time. We usually respond in under 5 minutes during business hours.</p>
                                <button className="text-[10px] font-black uppercase tracking-widest text-[#0077B6] flex items-center gap-2 hover:gap-3 transition-all">
                                    Start Chatting <ChevronRight size={14} />
                                </button>
                            </div>

                            <div className="p-8 rounded-[32px] border border-gray-300 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
                                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-6">
                                    <HelpCircle size={24} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-3">Support Center</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed mb-6">Browse our comprehensive guides and FAQs to find quick answers to common questions.</p>
                                <button className="text-[10px] font-black uppercase tracking-widest text-[#0077B6] flex items-center gap-2 hover:gap-3 transition-all">
                                    Visit Knowledge Base <ChevronRight size={14} />
                                </button>
                            </div>

                            <div className="p-8 rounded-[32px] border border-gray-300 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all">
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                                    <Play size={24} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-3">Quick Tutorial</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed mb-6">New to Task-O? Take a quick interactive tour to learn the essentials of our platform.</p>
                                <button
                                    onClick={() => setIsTutorialOpen(true)}
                                    className="text-[10px] font-black uppercase tracking-widest text-[#0077B6] flex items-center gap-2 hover:gap-3 transition-all"
                                >
                                    Start Tour <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-500/5 rounded-[40px] p-10 text-center relative overflow-hidden mt-auto border border-indigo-100 dark:border-indigo-500/10">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Need personalized help?</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-8 max-w-md mx-auto font-medium">Create a support ticket and our team will get back to you with a detailed solution.</p>
                                <button
                                    onClick={() => setIsSupportModalOpen(true)}
                                    className="px-10 py-4 bg-indigo-600 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black rounded-2xl hover:bg-indigo-700 dark:hover:bg-gray-50 transition-all shadow-xl shadow-indigo-200 dark:shadow-none uppercase tracking-widest flex items-center gap-3 mx-auto"
                                >
                                    <Send size={16} /> Create Support Ticket
                                </button>
                            </div>
                            <div className="absolute -left-10 -bottom-10 text-indigo-500/5 dark:text-white/5 rotate-12">
                                <LifeBuoy size={200} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CreateSupportRequestModal
                isOpen={isSupportModalOpen}
                onClose={() => setIsSupportModalOpen(false)}
            />

            <TutorialModal
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
                isDismissed={!showTutorialGlow}
                onToggleDismissal={(checked) => {
                    localStorage.setItem('tutorialDismissed', checked ? 'true' : 'false')
                    setShowTutorialGlow(!checked)
                }}
            />
        </DashboardLayout>
    )
}
