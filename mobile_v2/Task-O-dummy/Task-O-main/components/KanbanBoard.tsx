'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { supabase } from '@/lib/supabase/client'
import { Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import Modal from './ui/Modal'
import TaskDetailDrawer from './projects/TaskDetailDrawer'
import { useGuidedTour } from './GuidedTour'
import { updateTask, bulkUpdateTaskStatus } from '@/lib/tasks/actions'
import BulkActionBar from './tasks/BulkActionBar'
import { Check } from 'lucide-react'

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
  { id: 'pending', title: 'To Do', color: 'bg-[#0096C7]' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-[#CF7929]' },
  { id: 'review', title: 'Review', color: 'bg-[#6366f1]' },
  { id: 'completed', title: 'Done', color: 'bg-[#1E9E74]' },
]

export default function KanbanBoard({ projectId, teamId, userId, tasks: initialTasks, canManage = false }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks || [])
  const [loading, setLoading] = useState(!initialTasks)
  const [winReady, setWinReady] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userTeams, setUserTeams] = useState<string[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const isDraggingRef = useRef(false)
  const { activeTourId, nextStep, currentStep } = useGuidedTour()

  const fetchUserContext = useCallback(async () => {
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

      // Fetch user teams
      const { data: teams } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
      setUserTeams(teams?.map(t => t.team_id) || [])
    }
  }, [projectId])

  const fetchTasks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch teams the user is a member of
      const { data: userTeams } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)

      const userTeamIds = userTeams?.map(ut => ut.team_id) || []

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
            email,
            avatar_url
          )
        `)

      if (projectId) {
        query = query.eq('project_id', projectId)
      } else if (teamId) {
        query = query.eq('team_id', teamId)
      } else if (userId) {
        query = query.eq('assigned_to', userId)
      }

      // Final visibility filter: If on any teams, see all tasks for those teams.
      // If NOT on any teams, see only tasks assigned to them.
      if (userTeamIds.length > 0) {
        query = query.or(`team_id.in.(${userTeamIds.join(',')}),assigned_to.eq.${user.id}`)
      } else {
        query = query.eq('assigned_to', user.id)
      }

      const { data, error } = await query
      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId, teamId, userId])

  useEffect(() => {
    setWinReady(true)
    fetchUserContext()
    if (initialTasks) {
      setTasks(initialTasks)
      setLoading(false)
    } else {
      fetchTasks()
    }
  }, [projectId, teamId, userId, initialTasks, fetchTasks, fetchUserContext])

  // Real-time task syncing
  useEffect(() => {
    const channelName = `kanban-board-${projectId || teamId || userId || 'all'}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          // payload.new is populated on INSERT/UPDATE, payload.old on DELETE
          const record = payload.new && Object.keys(payload.new).length > 0 ? payload.new : payload.old

          // Basic filtering to prevent unnecessary fetches from other boards
          if (projectId && record && (record as any).project_id && (record as any).project_id !== projectId) return;
          if (teamId && record && (record as any).team_id && (record as any).team_id !== teamId) return;

          fetchTasks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, teamId, userId, fetchTasks])

  // Tutorial Ghost Task Injection
  useEffect(() => {
    if (activeTourId === 'kanban-basics' && !loading) {
      setTasks(prev => {
        const hasGhost = prev.some(t => t.id === 'tutorial-ghost-task')
        if (hasGhost) return prev
        const ghostTask: Task = {
          id: 'tutorial-ghost-task',
          title: 'Tactical Objective: Move Me!',
          description: 'This is a tutorial task. Drag this card to the "In Progress" column to start.',
          status: 'pending',
          priority: 'high',
          teams: { name: 'Technical' }
        }
        return [ghostTask, ...prev]
      })
    }
  }, [activeTourId, loading])

  const onDragStart = (start: any) => {
    isDraggingRef.current = true
    setDraggingId(start.draggableId)
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // Reset dragging state with a tiny delay to prevent the click event from firing
    setTimeout(() => {
      isDraggingRef.current = false
    }, 100)
    setDraggingId(null)
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

    // Check if we're dragging a selected task
    const isSelected = selectedTaskIds.includes(draggableId)
    const taskIdsToUpdate = isSelected ? selectedTaskIds : [draggableId]

    // Role-based validation
    const isAdmin = userRole === 'admin' || userRole === 'owner' || userRole === 'manager'
    const isTechLead = userRole === 'tech_lead'
    const isMember = userRole === 'member'

    // Simplified validation for bulk move: check each task or trust the selection logic?
    // Let's ensure role-based rules apply.
    if (isMember && newStatus === 'completed') return // Members cannot move to Done directly

    if (!isAdmin && !isTechLead && isMember && !isSelected) {
      if (task.assigned_to !== currentUserId) return
    } else if (!isAdmin && !isTechLead && !isMember) {
      return // Viewer
    }

    // Optimistic update
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        taskIdsToUpdate.includes(t.id) ? { ...t, status: newStatus } : t
      )
    )

    // Unified Drag-and-Drop handling
    if (draggableId === 'tutorial-ghost-task') {
      if (destination.droppableId === 'in_progress' && task.status === 'pending') {
        nextStep()
      } else if (destination.droppableId === 'review' && task.status === 'in_progress') {
        nextStep()
      } else if (destination.droppableId === 'completed' && task.status === 'review') {
        nextStep()
      }
      return // Don't sync to DB
    }

    try {
      if (isSelected) {
        await bulkUpdateTaskStatus(taskIdsToUpdate, newStatus, projectId || '')
        clearSelection()
      } else {
        await updateTask(draggableId, { status: newStatus })
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      fetchTasks() // Revert to server state on error
    }
  }

  const toggleTaskSelection = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening task details
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const clearSelection = () => setSelectedTaskIds([])

  const onBulkActionSuccess = () => {
    clearSelection()
    fetchTasks()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-rose-500 shadow-rose-500/5'
      case 'medium': return 'border-l-4 border-l-amber-500 shadow-amber-500/5'
      case 'low': return 'border-l-4 border-l-indigo-500 shadow-indigo-500/5'
      default: return 'border-l-4 border-l-slate-300'
    }
  }



  if (!winReady) return null

  if (loading) {
    return <div className="flex justify-center py-12 text-[10px] font-black uppercase tracking-widest text-gray-400">Loading board...</div>
  }

  return (
    <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
      <div id="tour-kanban-board" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id)

          return (
            <div key={column.id} className="flex flex-col">
              <div className={`mb-6 p-4 ${column.color} rounded-[20px] shadow-sm flex items-center justify-center gap-3`}>
                <h3 className="text-[14px] font-black text-white uppercase tracking-[0.1em]">
                  {column.title}
                </h3>
                <span className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full text-[11px] font-bold text-white shrink-0">
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
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                          isDragDisabled={!(userRole === 'admin' || userRole === 'manager' || userRole === 'owner' || task.id === 'tutorial-ghost-task' || task.assigned_to === currentUserId || selectedTaskIds.includes(task.id))}
                        >
                          {(provided, snapshot) => {
                            const isSelected = selectedTaskIds.includes(task.id)
                            const isDraggingOthersFromSelection = !!draggingId && isSelected && draggingId !== task.id && selectedTaskIds.includes(draggingId)

                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                id={task.id}
                                className={`group bg-white dark:bg-slate-950 p-6 rounded-[28px] shadow-sm ${getPriorityColor(
                                  task.priority
                                )} ${isSelected && !snapshot.isDragging ? 'rotate-[1deg] ring-1 ring-white/10' : ''} ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 z-50' : ''} border border-gray-100 dark:border-slate-800 transition-all hover:border-[#6366f1]/30 cursor-pointer relative`}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: isDraggingOthersFromSelection ? 0 : 1,
                                  pointerEvents: isDraggingOthersFromSelection ? 'none' : 'auto',
                                }}
                                onClick={() => {
                                  if (isDraggingRef.current) return
                                  if (task.id !== 'tutorial-ghost-task') setSelectedTask(task)
                                }}
                              >
                                {/* Selection Checkbox */}
                                {task.id !== 'tutorial-ghost-task' && (
                                  <div
                                    onClick={(e) => toggleTaskSelection(task.id, e)}
                                    className={`absolute top-4 right-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all z-20 ${isSelected
                                      ? 'bg-[#6366f1] border-[#6366f1] text-white'
                                      : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 opacity-0 group-hover:opacity-100'
                                      }`}
                                  >
                                    {isSelected && <Check size={14} strokeWidth={4} />}
                                  </div>
                                )}

                                {/* Multi-drag Building / Stack Visuals */}
                                {snapshot.isDragging && selectedTaskIds.length > 1 && isSelected && (
                                  <>
                                    <div className="absolute inset-0 translate-x-3 translate-y-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[28px] -z-10 shadow-lg" />
                                    <div className="absolute inset-0 translate-x-6 translate-y-6 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-900 rounded-[28px] -z-20 shadow-xl" />

                                    {/* Multi-drag badge */}
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#6366f1] text-white flex items-center justify-center text-xs font-black shadow-lg z-[60] animate-bounce">
                                      {selectedTaskIds.length}
                                    </div>
                                  </>
                                )}

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
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {task.due_date && (
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${new Date(task.due_date) < new Date() && task.status !== 'completed'
                                          ? 'bg-red-50 text-red-500 dark:bg-red-500/10'
                                          : 'bg-gray-50 text-gray-400 dark:bg-slate-800'
                                          }`}>
                                          <Calendar className="h-2.5 w-2.5 shrink-0" />
                                          <span className="whitespace-nowrap">{format(new Date(task.due_date), 'MMM dd')}</span>
                                        </div>
                                      )}
                                      {task.assignee && (
                                        <div className="w-6 h-6 shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[9px] font-black text-[#6366f1] border border-indigo-100 dark:border-indigo-500/20">
                                          {task.assignee.full_name?.[0] || 'U'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          }}
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

      {selectedTaskIds.length > 0 && (
        <BulkActionBar
          selectedIds={selectedTaskIds}
          projectId={projectId || ''}
          onClear={clearSelection}
          onSuccess={onBulkActionSuccess}
        />
      )}
    </DragDropContext>
  )
}
