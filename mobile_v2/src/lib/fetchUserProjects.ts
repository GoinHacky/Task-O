import { supabase } from '@/src/lib/supabase'
import { ProjectItem } from '@/src/types'

export type ProjectWithRole = ProjectItem & { role?: string }

export type UserProjectsSort = 'created_desc' | 'name_asc'

/**
 * Loads all projects the current user may see: owned (`owner_id`) OR accepted `project_members`.
 * Avoids `project_members!inner` on `projects`, which hides owner-only rows when membership is missing/pending.
 */
export async function fetchProjectsForCurrentUser(
  sort: UserProjectsSort = 'created_desc',
): Promise<ProjectWithRole[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase.from('projects').select('*').eq('owner_id', user.id),
    supabase
      .from('project_members')
      .select('project_id, role')
      .eq('user_id', user.id)
      .eq('status', 'accepted'),
  ])

  const ownedRows = (owned || []) as ProjectItem[]
  const ownedIds = new Set(ownedRows.map(p => p.id))

  const roleByProject = new Map<string, string>()
  for (const m of memberships || []) {
    const row = m as { project_id: string; role: string }
    if (row.project_id) roleByProject.set(row.project_id, row.role)
  }

  const memberOnlyIds = [
    ...new Set((memberships || []).map(m => (m as { project_id: string }).project_id).filter(Boolean)),
  ].filter(id => !ownedIds.has(id))

  let memberRows: ProjectItem[] = []
  if (memberOnlyIds.length > 0) {
    const { data: mp } = await supabase.from('projects').select('*').in('id', memberOnlyIds)
    memberRows = (mp || []) as ProjectItem[]
  }

  const merged: ProjectWithRole[] = [
    ...ownedRows.map(p => ({
      ...p,
      role: roleByProject.get(p.id) ?? 'admin',
    })),
    ...memberRows.map(p => ({
      ...p,
      role: roleByProject.get(p.id) ?? 'member',
    })),
  ]

  if (sort === 'name_asc') {
    merged.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  } else {
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return merged
}
