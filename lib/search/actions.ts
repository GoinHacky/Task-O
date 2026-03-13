'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export type SearchResult = {
    id: string
    title: string
    type: 'project' | 'task' | 'team'
    subtitle?: string
    href: string
    status?: string
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return []

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const results: SearchResult[] = []

    // 1. Search Projects
    const { data: projects } = await supabase
        .from('project_members')
        .select('projects(id, name, status)')
        .eq('user_id', user.id)
        .ilike('projects.name', `%${query}%`)
        .limit(5)

    if (projects) {
        projects.forEach((p: any) => {
            if (p.projects) {
                results.push({
                    id: p.projects.id,
                    title: p.projects.name,
                    type: 'project',
                    status: p.projects.status,
                    href: `/projects/${p.projects.id}`
                })
            }
        })
    }

    // 2. Search Tasks
    const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status, project_id')
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
        .ilike('title', `%${query}%`)
        .limit(5)

    if (tasks) {
        tasks.forEach((t: any) => {
            results.push({
                id: t.id,
                title: t.title,
                type: 'task',
                status: t.status,
                href: `/projects/${t.project_id}/tasks` // Can refine to specific task view if available
            })
        })
    }

    // 3. Search Teams
    const { data: teams } = await supabase
        .from('team_members')
        .select('teams(id, name)')
        .eq('user_id', user.id)
        .ilike('teams.name', `%${query}%`)
        .limit(5)

    if (teams) {
        teams.forEach((t: any) => {
            if (t.teams) {
                results.push({
                    id: t.teams.id,
                    title: t.teams.name,
                    type: 'team',
                    href: `/dashboard` // Update to dynamic team view if implemented
                })
            }
        })
    }

    return results
}
