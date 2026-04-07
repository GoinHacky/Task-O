'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditProjectPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState('active')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                const { data: project, error: fetchError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', params.id)
                    .eq('owner_id', user.id)
                    .single()

                if (fetchError || !project) {
                    throw new Error('Project not found or you don\'t have permission to edit it')
                }

                setName(project.name)
                setDescription(project.description || '')
                setStatus(project.status)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchProject()
    }, [params.id, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            const { error: updateError } = await supabase
                .from('projects')
                .update({
                    name,
                    description,
                    status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', params.id)

            if (updateError) throw updateError

            router.push(`/projects/${params.id}`)
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'An error occurred during update')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="px-4 py-8 text-center">
                <p className="text-gray-500">Loading project details...</p>
            </div>
        )
    }

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
                <Link
                    href={`/projects/${params.id}`}
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Project
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
            </div>

            <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Project Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                            placeholder="Enter project name"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="description"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                            placeholder="Enter project description"
                        />
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                        </label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                        >
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Link
                            href={`/projects/${params.id}`}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
