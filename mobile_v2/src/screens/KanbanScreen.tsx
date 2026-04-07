import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'

import { fetchProjectsForCurrentUser } from '@/src/lib/fetchUserProjects'
import { supabase } from '@/src/lib/supabase'
import { ProjectItem, TaskItem } from '@/src/types'
import { palette } from '@/src/theme'

const COLS: { id: TaskItem['status']; title: string; color: string }[] = [
  { id: 'pending', title: 'To Do', color: '#0096C7' },
  { id: 'in_progress', title: 'In Progress', color: '#CF7929' },
  { id: 'review', title: 'Review', color: '#6366f1' },
  { id: 'completed', title: 'Done', color: '#1E9E74' },
]

export default function KanbanScreen() {
  const { projectId: paramPid } = useLocalSearchParams<{ projectId?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)

  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)

  const loadProjectsOnce = useCallback(async () => {
    const list = await fetchProjectsForCurrentUser('name_asc')
    setProjects(list as ProjectItem[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProjectsOnce()
  }, [loadProjectsOnce])

  useEffect(() => {
    if (paramPid) {
      setProjectId(paramPid)
      return
    }
    if (projects.length && !projectId) {
      setProjectId(projects[0].id)
    }
  }, [paramPid, projects, projectId])

  const loadTasks = useCallback(async () => {
    if (!projectId) return
    const { data } = await supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    setTasks((data || []) as TaskItem[])
  }, [projectId])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  async function moveTask(task: TaskItem, next: TaskItem['status']) {
    const { error } = await supabase
      .from('tasks')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', task.id)
    if (!error) loadTasks()
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  if (projects.length === 0) {
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
        <View style={styles.emptyBig}>
          <Text style={styles.emptyBigTitle}>No projects</Text>
          <Text style={styles.emptyBigText}>Join a project to use the board.</Text>
        </View>
      </View>
    )
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectPick}>
        {projects.map(p => (
          <Pressable
            key={p.id}
            onPress={() => setProjectId(p.id)}
            style={[styles.projChip, projectId === p.id && styles.projChipOn]}
          >
            <Text style={[styles.projChipText, projectId === p.id && styles.projChipTextOn]} numberOfLines={1}>
              {p.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
        {COLS.map(col => (
          <View key={col.id} style={[styles.column, { borderTopColor: col.color }]}>
            <View style={styles.colHead}>
              <View style={[styles.colDot, { backgroundColor: col.color }]} />
              <Text style={styles.colTitle}>{col.title}</Text>
              <Text style={styles.colCount}>{tasks.filter(t => t.status === col.id).length}</Text>
            </View>
            <ScrollView nestedScrollEnabled contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
              {tasks
                .filter(t => t.status === col.id)
                .map(task => (
                  <View key={task.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{task.title}</Text>
                    <View style={styles.cardActions}>
                      {COLS.map(c => (
                        <Pressable
                          key={c.id}
                          onPress={() => moveTask(task, c.id)}
                          style={[styles.miniBtn, task.status === c.id && styles.miniBtnOn]}
                        >
                          <Text style={styles.miniBtnText}>{c.title.slice(0, 1)}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <CreateTaskModal visible={taskModal} onClose={() => setTaskModal(false)} onCreated={loadTasks} onCreateProject={() => setProjectModal(true)} />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onCreated={loadTasks} />
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreated={loadTasks} onCreateProject={() => setProjectModal(true)} />
      <InviteMemberModal visible={memberModal} onClose={() => setMemberModal(false)} onCreated={loadTasks} onCreateProject={() => setProjectModal(true)} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  topTitle: { fontSize: 17, fontWeight: '900', color: palette.text },
  projectPick: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  projChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    maxWidth: 180,
  },
  projChipOn: { borderColor: palette.primaryMid, backgroundColor: palette.accentSoft },
  projChipText: { fontSize: 13, fontWeight: '700', color: palette.muted },
  projChipTextOn: { color: palette.primaryMid },
  board: { paddingHorizontal: 12, paddingBottom: 40, gap: 12 },
  column: {
    width: 260,
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    borderTopWidth: 4,
    maxHeight: 560,
    paddingBottom: 8,
  },
  colHead: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  colDot: { width: 8, height: 8, borderRadius: 4 },
  colTitle: { flex: 1, fontWeight: '900', fontSize: 12, color: palette.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  colCount: { fontSize: 12, fontWeight: '800', color: palette.muted },
  card: {
    marginHorizontal: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: palette.text },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  miniBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  miniBtnOn: { backgroundColor: palette.accentSoft, borderColor: palette.accent },
  miniBtnText: { fontSize: 10, fontWeight: '900', color: palette.muted },
  emptyBig: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyBigTitle: { fontSize: 20, fontWeight: '900', color: palette.text },
  emptyBigText: { marginTop: 8, color: palette.muted, textAlign: 'center' },
})
