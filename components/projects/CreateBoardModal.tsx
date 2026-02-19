'use client'

import { useState, useEffect } from 'react'
import { Layout, CheckCircle2, AlertCircle, Plus, Trash2, GripVertical, Settings2, Kanban, Zap } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CreateBoardModalProps {
    isOpen: boolean
    onClose: () => void
    projectId?: string
    teamId?: string
}

export default function CreateBoardModal({ isOpen, onClose, projectId, teamId }: CreateBoardModalProps) {
    const router = useRouter()
    const [name, setName] = useState('')
    const [type, setType] = useState<'kanban' | 'scrum'>('kanban')
    const [columns, setColumns] = useState<string[]>(['To Do', 'In Progress', 'Done'])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const addColumn = () => {
        setColumns([...columns, 'New Column'])
    }

    const removeColumn = (index: number) => {
        if (columns.length <= 1) return
        setColumns(columns.filter((_, i) => i !== index))
    }

    const updateColumn = (index: number, newName: string) => {
        const newColumns = [...columns]
        newColumns[index] = newName
        setColumns(newColumns)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Unauthorized')

            // 1. Create the board
            const { data: board, error: boardError } = await supabase
                .from('boards')
                .insert({
                    name,
                    type,
                    project_id: projectId,
                    team_id: teamId,
                    owner_id: user.id
                })
                .select()
                .single()

            if (boardError) throw boardError

            // 2. Create columns
            const columnData = columns.map((title, index) => ({
                board_id: board.id,
                title,
                order_index: index,
                status_mapping: title.toLowerCase().replace(/\s+/g, '_')
            }))

            const { error: columnError } = await supabase
                .from('board_columns')
                .insert(columnData)

            if (columnError) throw columnError

            setSuccess(true)
            setTimeout(() => {
                setSuccess(false)
                onClose()
                router.refresh()
            }, 2000)
        } catch (err: any) {
            // Handle table not found by simulating success for demo if needed, 
            // but ideally we want the user to run SQL.
            setError(err.message || 'Mission failed. Check infrastructure.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Board"
        >
            {success ? (
                <div className="py-12 text-center animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-3xl bg-indigo-50 text-indigo-500 mb-6 shadow-sm border border-indigo-100">
                        <Zap className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Board Created</h3>
                    <p className="mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                        New board created successfully.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8 max-w-[500px] mx-auto">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600 animate-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Board Identity */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Board Name</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <Layout size={14} />
                                    </div>
                                </span>
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-gray-900 shadow-sm"
                                    placeholder="Enter board title (e.g., Q1 Roadmap)"
                                />
                            </div>
                        </div>

                        {/* Board Type */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Board Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setType('kanban')}
                                    className={`relative flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all ${type === 'kanban'
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-lg shadow-indigo-500/10'
                                        : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                        }`}
                                >
                                    <Kanban size={24} className={type === 'kanban' ? 'text-indigo-500' : 'text-gray-300'} />
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Kanban</p>
                                        <p className="text-[8px] font-bold opacity-60 leading-none">Continuous Flow</p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('scrum')}
                                    className={`relative flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all ${type === 'scrum'
                                        ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-lg shadow-amber-500/10'
                                        : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                        }`}
                                >
                                    <Zap size={24} className={type === 'scrum' ? 'text-amber-500' : 'text-gray-300'} />
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Scrum</p>
                                        <p className="text-[8px] font-bold opacity-60 leading-none">Sprints & Burndown</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Column Configuration */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Columns</label>
                                <button
                                    type="button"
                                    onClick={addColumn}
                                    className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                                >
                                    + Add Column
                                </button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                                {columns.map((col, idx) => (
                                    <div key={idx} className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-200">
                                        <div className="flex-1 relative group">
                                            <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-gray-400">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                                    <GripVertical size={12} />
                                                </div>
                                            </span>
                                            <input
                                                type="text"
                                                value={col}
                                                onChange={(e) => updateColumn(idx, e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:border-indigo-500 outline-none transition-all text-xs font-bold text-gray-700 shadow-sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeColumn(idx)}
                                            className="p-3 text-gray-300 hover:text-rose-500 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4 pt-8 border-t border-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-4 border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="flex-1 px-4 py-4 bg-gray-900 text-white text-[10px] font-black rounded-2xl hover:bg-black disabled:opacity-50 transition-all shadow-xl shadow-gray-900/10 active:scale-95 uppercase tracking-[0.2em]"
                        >
                            {loading ? 'Processing...' : 'Create Board'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    )
}
