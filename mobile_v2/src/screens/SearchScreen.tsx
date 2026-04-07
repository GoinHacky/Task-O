import { type Href, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type Result = { id: string; title: string; type: 'project' | 'task' | 'team'; subtitle?: string }

export default function SearchScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)

  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)

  const run = useCallback(async () => {
    const query = q.trim()
    if (query.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const out: Result[] = []

    const { data: memRows } = await supabase.from('project_members').select('project_id').eq('user_id', user.id)
    const pids = (memRows || []).map(m => (m as { project_id: string }).project_id).filter(Boolean)
    if (pids.length > 0) {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', pids)
        .ilike('name', `%${query}%`)
        .limit(8)
      for (const p of projects || []) {
        const row = p as { id: string; name: string }
        out.push({ id: row.id, title: row.name, type: 'project' })
      }
    }

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, project_id')
      .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
      .ilike('title', `%${query}%`)
      .limit(12)
    for (const t of tasks || []) {
      const row = t as { id: string; title: string; status: string; project_id: string | null }
      out.push({
        id: row.id,
        title: row.title,
        type: 'task',
        subtitle: row.status,
      })
    }

    const { data: tmRows } = await supabase.from('team_members').select('team_id').eq('user_id', user.id)
    const tids = (tmRows || []).map(t => (t as { team_id: string }).team_id).filter(Boolean)
    if (tids.length > 0) {
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', tids)
        .ilike('name', `%${query}%`)
        .limit(8)
      for (const tm of teams || []) {
        const row = tm as { id: string; name: string }
        out.push({ id: row.id, title: row.name, type: 'team' })
      }
    }

    setResults(out)
    setLoading(false)
  }, [q])

  function open(r: Result) {
    if (r.type === 'project') router.push(`/project/${r.id}` as Href)
    else if (r.type === 'task') router.push(`/task/${r.id}` as Href)
    else router.push(`/dashboard` as Href)
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        onBack={() => router.back()}
        onNotification={() => router.push('/notifications')}
        onAddTask={() => setTaskModal(true)}
        onAddProject={() => setProjectModal(true)}
        onAddTeam={() => setTeamModal(true)}
        onAddMember={() => setMemberModal(true)}
      />
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Projects, tasks, teams…"
          placeholderTextColor="#94a3b8"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={run}
          returnKeyType="search"
        />
        <Pressable style={styles.go} onPress={run}>
          <Text style={styles.goText}>Go</Text>
        </Pressable>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 20 }} color={palette.primaryMid} /> : null}
      <ScrollView contentContainerStyle={styles.body}>
        {results.map(r => (
          <Pressable key={`${r.type}-${r.id}`} style={styles.row} onPress={() => open(r)}>
            <Text style={styles.badge}>{r.type}</Text>
            <Text style={styles.title}>{r.title}</Text>
            {r.subtitle ? <Text style={styles.sub}>{r.subtitle}</Text> : null}
          </Pressable>
        ))}
        {!loading && q.length >= 2 && results.length === 0 ? (
          <Text style={styles.empty}>No matches.</Text>
        ) : null}
      </ScrollView>

      <CreateTaskModal visible={taskModal} onClose={() => setTaskModal(false)} onCreated={run} onCreateProject={() => setProjectModal(true)} />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onCreated={run} />
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreated={run} onCreateProject={() => setProjectModal(true)} />
      <InviteMemberModal visible={memberModal} onClose={() => setMemberModal(false)} onCreated={run} onCreateProject={() => setProjectModal(true)} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: palette.surface,
    color: palette.text,
  },
  go: {
    backgroundColor: palette.primaryMid,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  goText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  body: { padding: 16, paddingBottom: 40 },
  row: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    marginBottom: 10,
  },
  badge: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: { fontSize: 16, fontWeight: '800', color: palette.text },
  sub: { fontSize: 12, color: palette.muted, marginTop: 4, fontWeight: '600' },
  empty: { textAlign: 'center', color: palette.muted, marginTop: 24, fontWeight: '600' },
})
