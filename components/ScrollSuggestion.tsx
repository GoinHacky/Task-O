'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function ScrollSuggestion() {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setIsVisible(false)
            } else {
                setIsVisible(true)
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    if (!isVisible) return null

    return (
        <>
            <style jsx>{`
                @keyframes soft-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .animate-soft-float {
                    animation: soft-float 3s ease-in-out infinite;
                }
            `}</style>
            <div
                onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-soft-float cursor-pointer z-[100] transition-transform hover:scale-105 active:scale-95"
            >
                <div className="px-4 py-2 rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-gray-200/50 dark:border-slate-800/50 shadow-2xl flex items-center gap-3">
                    <ChevronDown size={14} className="text-[#6366f1] stroke-[3]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-900 dark:text-slate-100 opacity-70">More contents below</span>
                </div>
            </div>
        </>
    )
}
