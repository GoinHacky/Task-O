export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high' | null

export type TaskItem = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  project_id: string | null
  assigned_to: string | null
  created_by: string
  created_at: string
  projects?: { id: string; name: string } | null
}

export type ProjectItem = {
  id: string
  name: string
  description: string | null
  /** DB: planning | active | archived */
  status: 'planning' | 'active' | 'archived'
  owner_id: string
  created_at: string
}

export type NotificationItem = {
  id: string
  user_id: string
  type: string
  message: string
  read: boolean
  created_at: string
  related_id?: string | null
  metadata?: Record<string, unknown> | null
}

export type TeamMembership = {
  role: string
  teams: {
    id: string
    name: string
    avatar_url: string | null
    project_id: string | null
    team_members?: { count: number }[]
  } | null
}

export type SupportRequest = {
  id: string
  ticket_id: string | null
  title: string
  category: string
  severity: string
  status: string
  description: string
  created_at: string
  user_id?: string | null
  where_did_it_happen?: string | null
}

export type SupportComment = {
  id: string
  content: string
  created_at: string
  user_id: string
  is_admin_note: boolean | null
}
