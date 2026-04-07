'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditTaskPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState('pending')
    const [priority, setPriority] = useState('medium')
    const [dueDate, setDueDate] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [projects, setProjects] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                // Fetch task details
                const { data: task, error: taskError } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('id', params.id)
                    .single()

                if (taskError || !task) {
                    throw new Error('Task not found')
                }

                setTitle(task.title)
                setDescription(task.description || '')
                setStatus(task.status)
                setPriority(task.priority)
                setDueDate(task.due_date ? task.due_date.split('T')[0] : '')
                setAssignedTo(task.assigned_to)
                setSelectedProjectId(task.project_id || '')

                // Fetch user's projects
                const { data: projectsData } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('owner_id', user.id)

                if (projectsData) {
                    setProjects(projectsData)
                }

                // Fetch users (for now, just the current user/all users)
                const { data: usersData } = await supabase.from('users').select('*')
                if (usersData) {
                    setUsers(usersData)
                }
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [params.id, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            const { error: updateError } = await supabase
                .from('tasks')
                .update({
                    title,
                    description,
                    status,
                    priority,
                    due_date: dueDate || null,
                    assigned_to: assignedTo,
                    project_id: selectedProjectId || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', params.id)

            if (updateError) throw updateError

            router.push(`/tasks/${params.id}`)
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'An error occurred')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="px-4 py-8 text-center">
                <p className="text-gray-500">Loading task details...</p>
            </div>
        )
    }

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
                <Link
                    href={`/tasks/${params.id}`}
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Task
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
            </div>

            <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                            placeholder="Enter task title"
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
                            placeholder="Enter task description"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                                Project
                            </label>
                            <select
                                id="project"
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                            >
                                <option value="">No project</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                                Assign To
                            </label>
                            <select
                                id="assignedTo"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                            >
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name || user.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
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
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                                Priority
                            </label>
                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                                Due Date
                            </label>
                            <input
                                type="date"
                                id="dueDate"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Link
                            href={`/tasks/${params.id}`}
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
