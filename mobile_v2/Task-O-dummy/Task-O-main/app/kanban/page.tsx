'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import KanbanBoard from '@/components/KanbanBoard'
export default function KanbanPage() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) return

      setUser(currentUser)

      // Fetch user's projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', currentUser.id)
        .order('name', { ascending: true })

      if (projectsData && projectsData.length > 0) {
        setProjects(projectsData)
        setProjectId(projectsData[0].id)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!projectId) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects</h3>
          <p className="text-sm text-gray-500">
            Create a project first to use the Kanban board.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Kanban Board</h1>
        <div className="flex items-center space-x-4">
          <label htmlFor="project" className="text-sm font-medium text-gray-700">
            Project:
          </label>
          <select
            id="project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <KanbanBoard projectId={projectId} userId={user?.id} />
    </div>
  )
}

