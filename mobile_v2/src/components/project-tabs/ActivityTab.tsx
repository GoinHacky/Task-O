import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { FadeIn } from '@/src/components/FadeIn'
import { ListSkeleton } from '@/src/components/Skeleton'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type Row = { id: string; type: string; message: string; created_at: string }

export function ActivityTab({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setRows([])
      setLoading(false)
      return
    }

    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .maybeSingle()

    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single()

    const userRole =
      (membership as { role?: string } | null)?.role ||
      ((project as { owner_id?: string } | null)?.owner_id === user.id ? 'owner' : 'member')

    // Match web behavior:
    // - owner/admin without team restrictions: see all project activities
    // - admin with teams: only activities tied to their team tasks + general (task_id null)
    if (userRole === 'admin') {
      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)

      const userTeamIds = (teamMemberships || []).map((t: any) => t.team_id).filter(Boolean)

      if (userTeamIds.length > 0) {
        const { data: teamTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('project_id', projectId)
          .in('team_id', userTeamIds)

        const taskIds = (teamTasks || []).map((t: any) => t.id).filter(Boolean)
        const orFilter =
          taskIds.length > 0 ? `task_id.in.(${taskIds.join(',')}),task_id.is.null` : 'task_id.is.null'

        const { data } = await supabase
          .from('activities')
          .select('id, type, message, created_at')
          .eq('project_id', projectId)
          .or(orFilter)
          .order('created_at', { ascending: false })
          .limit(50)

        setRows((data || []) as Row[])
      } else {
        const { data } = await supabase
          .from('activities')
          .select('id, type, message, created_at')
          .eq('project_id', projectId)
          .is('task_id', null)
          .order('created_at', { ascending: false })
          .limit(50)

        setRows((data || []) as Row[])
      }
    } else {
      const { data } = await supabase
        .from('activities')
        .select('id, type, message, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50)

      setRows((data || []) as Row[])
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  if (loading) return <ListSkeleton />

  return (
    <FadeIn>
    <View style={s.root}>
      <View style={s.head}>
        <Text style={s.headTitle}>Mission History</Text>
        <Text style={s.headSub}>Real-time tactical operations log</Text>
      </View>
      {rows.length === 0 ? (
        <View style={s.emptyWrap}>
          <View style={s.emptyIconBox}>
            <Ionicons name="time-outline" size={30} color="#cbd5e1" />
          </View>
          <Text style={s.empty}>No activities recorded yet</Text>
        </View>
      ) : null}
      {rows.map(a => (
        <View key={a.id} style={s.card}>
          <Text style={s.type}>{a.type.replace(/_/g, ' ')}</Text>
          <Text style={s.msg}>{a.message}</Text>
          <Text style={s.time}>{new Date(a.created_at).toLocaleString()}</Text>
        </View>
      ))}
    </View>
    </FadeIn>
  )
}

const s = StyleSheet.create({
  root: { gap: 0, paddingBottom: 4 },
  head: { marginBottom: 18 },
  headTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: -0.4,
  },
  headSub: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '800',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  card: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, marginBottom: 10 },
  type: { fontSize: 10, fontWeight: '900', color: palette.accent, textTransform: 'uppercase', letterSpacing: 0.8 },
  msg: { fontSize: 15, fontWeight: '700', color: palette.text, marginTop: 6 },
  time: { fontSize: 11, color: palette.muted, marginTop: 8, fontWeight: '600' },
  emptyWrap: { paddingVertical: 64, alignItems: 'center', justifyContent: 'center' },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  empty: {
    textAlign: 'center',
    color: palette.muted,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
})
