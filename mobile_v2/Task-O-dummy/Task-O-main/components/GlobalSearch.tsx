'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Layout, CheckCircle2, Users, Command, CornerDownLeft, Loader2 } from 'lucide-react'
import { globalSearch, SearchResult } from '@/lib/search/actions'
import { useRouter } from 'next/navigation'
import Portal from './ui/Portal'

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    // Keyboard Shortcut (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
            if (e.key === 'Escape') {
                setIsOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Outside click listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (isOpen && !target.closest('.global-search-container')) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])


    // Search Logic with Debounce
    const handleSearch = useCallback(async (val: string) => {
        if (val.length < 2) {
            setResults([])
            return
        }
        setLoading(true)
        try {
            const data = await globalSearch(val)
            setResults(data)
            setSelectedIndex(0)
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Focus input when open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 10)
            if (query) {
                handleSearch(query)
            } else {
                setResults([])
            }
        }
    }, [isOpen, query, handleSearch])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) handleSearch(query)
        }, 300)
        return () => clearTimeout(timer)
    }, [query, handleSearch])

    // Keyboard Navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (results.length === 0) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev + 1) % results.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const selected = results[selectedIndex]
            if (selected) {
                router.push(selected.href)
                setIsOpen(false)
            }
        }
    }

    return (
        <div className="relative group flex-1 lg:flex-shrink-0 lg:flex-initial h-9 sm:h-10 lg:h-[43px] max-w-[629px] w-full z-50 global-search-container">
            <div className={`absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none transition-colors ${isOpen ? 'text-[#6366f1]' : 'text-gray-400 group-hover:text-blue-500'}`}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} className="sm:w-[15px] sm:h-[15px]" />}
            </div>

            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value)
                    setIsOpen(true)
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search missions, boards, teams..."
                className={`flex items-center w-full h-full pl-9 sm:pl-11 pr-12 rounded-xl sm:rounded-[22px] border outline-none text-xs sm:text-sm font-medium transition-all text-left placeholder:text-gray-400 dark:placeholder:text-slate-600 ${isOpen
                    ? 'bg-white dark:bg-slate-900 border-[#6366f1] ring-4 ring-[#6366f1]/10 shadow-xl'
                    : 'bg-blue-50/50 border-blue-100/80 hover:bg-blue-50/70 dark:bg-white/[0.05] dark:border-white/[0.07] dark:hover:bg-white/[0.08] text-gray-900 dark:text-slate-100'
                    }`}
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-black uppercase text-gray-400 tracking-widest pointer-events-none">
                <Command size={10} /> K
            </div>

            {/* Dropdown Results */}
            {isOpen && (query.length >= 2 || results.length > 0) && (
                <>
                    {/* Backdrop for click-outside handled by useEffect */}

                    <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-slate-800/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-[min(70vh,500px)] overflow-y-auto p-3 custom-scrollbar">
                            {results.length > 0 ? (
                                <div className="space-y-3">
                                    {['project', 'task', 'team'].map(type => {
                                        const typeResults = results.filter(r => r.type === type)
                                        if (typeResults.length === 0) return null

                                        return (
                                            <div key={type} className="space-y-1">
                                                <h3 className="px-3 py-1 text-[9px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-[0.2em]">{type}S</h3>
                                                <div className="space-y-0.5">
                                                    {typeResults.map((result) => {
                                                        const idx = results.indexOf(result)
                                                        const isActive = idx === selectedIndex

                                                        return (
                                                            <button
                                                                key={result.id}
                                                                onClick={() => {
                                                                    router.push(result.href)
                                                                    setIsOpen(false)
                                                                }}
                                                                onMouseEnter={() => setSelectedIndex(idx)}
                                                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group ${isActive ? 'bg-[#f3f4ff] dark:bg-indigo-500/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/30'}`}
                                                            >
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all ${isActive ? 'bg-white dark:bg-slate-900 border-[#6366f1]/20 text-[#6366f1]' : 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-400 group-hover:text-gray-600'}`}>
                                                                    {result.type === 'project' && <Layout size={16} />}
                                                                    {result.type === 'task' && <CheckCircle2 size={16} />}
                                                                    {result.type === 'team' && <Users size={16} />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-[#6366f1]' : 'text-gray-900 dark:text-slate-100'}`}>{result.title}</h4>
                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mt-0.5">
                                                                        {result.status || result.type}
                                                                    </p>
                                                                </div>
                                                                {isActive && (
                                                                    <div className="text-[#6366f1] animate-in fade-in slide-in-from-right-2">
                                                                        <CornerDownLeft size={14} />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : query.length >= 2 && !loading ? (
                                <div className="py-8 text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No results for &quot;{query}&quot;</p>
                                </div>
                            ) : null}
                        </div>

                        {/* Compact Footer */}
                        {results.length > 0 && (
                            <div className="px-4 py-2.5 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-50/50 dark:border-slate-800/10 flex items-center justify-between">
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <kbd className="flex items-center justify-center w-4 h-4 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[8px] font-black text-gray-400">↓</kbd>
                                        <kbd className="flex items-center justify-center w-4 h-4 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[8px] font-black text-gray-400">↑</kbd>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Navigate</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <kbd className="flex items-center justify-center px-1.5 h-4 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[8px] font-black text-gray-400">ENTER</kbd>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Select</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                    <span className="text-[8px] font-black text-indigo-500/60 uppercase tracking-widest">Global Index</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
