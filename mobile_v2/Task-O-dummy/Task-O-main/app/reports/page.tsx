import { createServerSupabaseClient } from '@/lib/supabase/server'
import ReportsCharts from '@/components/ReportsCharts'

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch all tasks for analytics
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', user.id)

  // Fetch all projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)

  // Calculate statistics
  const stats = {
    totalTasks: tasks?.length || 0,
    completedTasks: tasks?.filter((t) => t.status === 'completed').length || 0,
    inProgressTasks: tasks?.filter((t) => t.status === 'in_progress').length || 0,
    pendingTasks: tasks?.filter((t) => t.status === 'pending').length || 0,
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter((p) => p.status === 'active').length || 0,
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="mt-2 text-sm text-gray-600">
          View insights and statistics about your projects and tasks
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-gray-900">
                  {stats.totalTasks}
                </span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tasks
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-green-600">
                  {stats.completedTasks}
                </span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-yellow-600">
                  {stats.inProgressTasks}
                </span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In Progress
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600">
                  {stats.totalProjects}
                </span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Projects
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportsCharts tasks={tasks || []} projects={projects || []} />
    </div>
  )
}

