'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Task {
  status: string
  priority?: string
  created_at: string
}

interface Project {
  status: string
}

interface ReportsChartsProps {
  tasks: Task[]
  projects: Project[]
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444']

export default function ReportsCharts({ tasks, projects }: ReportsChartsProps) {
  // Prepare task status data
  const taskStatusData = [
    { name: 'Pending', value: tasks.filter((t) => t.status === 'pending').length },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'in_progress').length },
    { name: 'Completed', value: tasks.filter((t) => t.status === 'completed').length },
  ]

  // Prepare priority data
  const priorityData = [
    { name: 'High', value: tasks.filter((t) => t.priority === 'high').length },
    { name: 'Medium', value: tasks.filter((t) => t.priority === 'medium').length },
    { name: 'Low', value: tasks.filter((t) => t.priority === 'low').length },
  ]

  // Prepare project status data
  const projectStatusData = [
    { name: 'Active', value: projects.filter((p) => p.status === 'active').length },
    { name: 'On Hold', value: projects.filter((p) => p.status === 'on_hold').length },
    { name: 'Completed', value: projects.filter((p) => p.status === 'completed').length },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Task Status Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Task Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={taskStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {taskStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Priority Distribution */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Task Priority Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={priorityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Project Status Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={projectStatusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Task Completion Rate */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Task Completion Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={taskStatusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

