'use client'

import { Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import DeleteProjectModal from './projects/DeleteProjectModal'

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [projectName, setProjectName] = useState('')

    useEffect(() => {
        const fetchProject = async () => {
            const { data } = await supabase.from('projects').select('name').eq('id', projectId).single()
            if (data) setProjectName(data.name)
        }
        fetchProject()
    }, [projectId])

    const handleDelete = async () => {
        setLoading(true)
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)

        if (!error) {
            router.push('/projects')
            router.refresh()
        } else {
            alert('Error deleting project: ' + error.message)
            setLoading(false)
            setIsOpen(false)
        }
    }

    return (
        <>
            <button
                className="px-6 py-3 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-500/30 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                onClick={() => setIsOpen(true)}
            >
                <Trash2 size={16} />
                Delete Project
            </button>

            <DeleteProjectModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onConfirm={handleDelete}
                projectName={projectName}
                loading={loading}
            />
        </>
    )
}
