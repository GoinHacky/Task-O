'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { supabase } from '@/lib/supabase/client'
import { Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import Modal from './ui/Modal'
import TaskDetailDrawer from './projects/TaskDetailDrawer'

// StrictDroppable for React 18 + react-beautiful-dnd
import { DroppableProps } from 'react-beautiful-dnd'
export const StrictDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true))
    return () => {
      cancelAnimationFrame(animation)
      setEnabled(false)
    }
  }, [])
  if (!enabled) {
    return null
  }
  return <Droppable {...props}>{children}</Droppable>
}

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  due_date?: string
  assigned_to?: string
  team_id?: string
  teams?: {
    name: string
  }
  assignee?: {
    full_name?: string
    email?: string
  }
}

interface KanbanBoardProps {
  projectId?: string
  teamId?: string
  userId?: string
  tasks?: Task[]
  canManage?: boolean
}

const COLUMNS = [
  { id: 'pending', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'completed', title: 'Done' },
]

export default function KanbanBoard({ projectId, teamId, userId, tasks: initialTasks, canManage = false }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks || [])
  const [loading, setLoading] = useState(!initialTasks)
  const [winReady, setWinReady] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    setWinReady(true)
    fetchUserContext()
    if (initialTasks) {
      setTasks(initialTasks)
      setLoading(false)
    } else {
      fetchTasks()
    }
  }, [projectId, teamId, userId, initialTasks])

  const fetchUserContext = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      if (projectId) {
        const { data: member } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .single()
        if (member) setUserRole(member.role)
      }
    }
  }

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          teams:team_id (
            name
          ),
          assignee:assigned_to (
            id,
            full_name,
            email
          )
        `)

      if (projectId) {
        query = query.eq('project_id', projectId)
      } else if (teamId) {
        query = query.eq('team_id', teamId)
      } else if (userId) {
        query = query.eq('assigned_to', userId)
      }

      const { data, error } = await query
      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const newStatus = destination.droppableId
    const task = tasks.find((t) => t.id === draggableId)
    if (!task) return

    // Role-based validation
    const isAdmin = userRole === 'admin' || userRole === 'owner' || userRole === 'manager'
    const isTechLead = userRole === 'tech_lead'
    const isMember = userRole === 'member'

    if (isAdmin) {
      // Full access
    } else if (isTechLead) {
      // Can move tasks if they are the lead? 
      // Simplified: if it's in a team they belong to. 
      // For now, let's assume if they have the role and it's their team.
      // We might need to fetch their team_id.
    } else if (isMember) {
      if (task.assigned_to !== currentUserId) return
    } else {
      return // Viewer or no role
    }

    // Optimistic update
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === draggableId ? { ...t, status: newStatus } : t
      )
    )

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', draggableId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating task status:', error)
      fetchTasks() // Revert to server state on error
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-rose-500 shadow-rose-500/5'
      case 'medium': return 'border-l-4 border-l-amber-500 shadow-amber-500/5'
      case 'low': return 'border-l-4 border-l-indigo-500 shadow-indigo-500/5'
      default: return 'border-l-4 border-l-slate-300'
    }
  }

  const getTeamColor = (teamName: string) => {
    const colors: Record<string, string> = {
      'Logistics': 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20',
      'Marketing': 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:border-purple-500/20',
      'Security': 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:border-red-500/20',
      'Technical': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20'
    }
    return colors[teamName] || 'bg-gray-50 text-gray-600 dark:bg-slate-800 dark:border-slate-700'
  }

  if (!winReady) return null

  if (loading) {
    return <div className="flex justify-center py-12 text-[10px] font-black uppercase tracking-widest text-gray-400">Loading board...</div>
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id)

          return (
            <div key={column.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                  {column.title}
                </h3>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-gray-500">
                  {columnTasks.length}
                </span>
              </div>

              <StrictDroppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 min-h-[500px] rounded-[32px] p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : 'bg-gray-50/50 dark:bg-slate-900/40'
                      }`}
                  >
                    <div className="space-y-4">
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`group bg-white dark:bg-slate-950 p-6 rounded-[28px] shadow-sm ${getPriorityColor(
                                task.priority
                              )} ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 ring-2 ring-[#6366f1]/20' : ''} border border-gray-100 dark:border-slate-800 transition-all hover:border-[#6366f1]/30 cursor-pointer`}
                              onClick={() => setSelectedTask(task)}
                            >
                              <div className="flex flex-col gap-3">
                                <h4 className="text-[14px] font-black text-gray-900 dark:text-slate-100 mb-1 leading-tight group-hover:text-[#6366f1] transition-colors uppercase tracking-tightest">
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-[11px] text-gray-400 dark:text-slate-500 line-clamp-2 italic leading-relaxed font-bold">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50 dark:border-slate-800/50">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">{task.priority}</span>
                                    {task.teams?.name && (
                                      <span className={`ml-2 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${getTeamColor(task.teams.name)}`}>
                                        {task.teams.name}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {task.due_date && (
                                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${new Date(task.due_date) < new Date() && task.status !== 'completed'
                                        ? 'bg-red-50 text-red-500 dark:bg-red-500/10'
                                        : 'bg-gray-50 text-gray-400 dark:bg-slate-800'
                                        }`}>
                                        <Calendar className="h-2.5 w-2.5" />
                                        {format(new Date(task.due_date), 'MMM dd')}
                                      </div>
                                    )}
                                    {task.assignee && (
                                      <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[9px] font-black text-[#6366f1] border border-indigo-100 dark:border-indigo-500/20">
                                        {task.assignee.full_name?.[0] || 'U'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </StrictDroppable>
            </div>
          )
        })}
      </div>

      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Task Details"
      >
        {selectedTask && (
          <TaskDetailDrawer
            task={selectedTask}
            projectId={projectId || ''}
            canManage={canManage}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </Modal>
    </DragDropContext>
  )
}
