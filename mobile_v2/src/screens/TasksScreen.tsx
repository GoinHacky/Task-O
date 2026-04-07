import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { type Href, useRouter, useNavigation } from 'expo-router'
import { DrawerActions } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated'

import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { supabase } from '@/src/lib/supabase'
import { TaskItem } from '@/src/types'
import { palette } from '@/src/theme'

type StatusFilter = 'all' | TaskItem['status']

function statusLabel(status: TaskItem['status']) {
  if (status === 'in_progress') return 'In Progress'
  if (status === 'review') return 'Review'
  if (status === 'completed') return 'Completed'
  return 'Pending'
}

function getPriorityStyle(priority: string | null | undefined) {
  switch (priority) {
    case 'high': return { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' }
    case 'medium': return { bg: '#fffbeb', text: '#d97706', dot: '#f59e0b' }
    case 'low': return { bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e' }
    default: return { bg: '#f1f5f9', text: '#94a3b8', dot: '#cbd5e1' }
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'completed': return { bg: '#f0fdf4', text: '#16a34a' }
    case 'in_progress': return { bg: '#eff6ff', text: '#3b82f6' }
    case 'review': return { bg: '#faf5ff', text: '#8b5cf6' }
    default: return { bg: '#f8fafc', text: '#64748b' }
  }
}

export default function TasksScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [showProjectCreate, setShowProjectCreate] = useState(false)
  const [showTeamCreate, setShowTeamCreate] = useState(false)
  const [showMemberInvite, setShowMemberInvite] = useState(false)

  const loadTasks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
      .order('created_at', { ascending: false })
    setTasks((data || []) as TaskItem[])
    setLoading(false)
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  const filtered = statusFilter === 'all' ? tasks : tasks.filter(t => t.status === statusFilter)
  const statusFilters: StatusFilter[] = ['all', 'pending', 'in_progress', 'review', 'completed']

  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={palette.primary} /></View>
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        onMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
        onNotification={() => router.push('/notifications')}
        onAddTask={() => setShowCreate(true)}
        onAddProject={() => setShowProjectCreate(true)}
        onAddTeam={() => setShowTeamCreate(true)}
        onAddMember={() => setShowMemberInvite(true)}
      />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadTasks(); setRefreshing(false) }} tintColor={palette.primary} />}>

        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statVal}>{total}</Text><Text style={styles.statLab}>Total</Text></View>
          <View style={styles.statBox}><Text style={[styles.statVal, { color: '#16a34a' }]}>{completed}</Text><Text style={styles.statLab}>Done</Text></View>
          <View style={styles.statBox}><Text style={[styles.statVal, { color: overdue > 0 ? '#dc2626' : palette.muted }]}>{overdue}</Text><Text style={styles.statLab}>Overdue</Text></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {statusFilters.map(f => (
            <Pressable key={f} onPress={() => setStatusFilter(f)} style={[styles.fChip, statusFilter === f && styles.fChipOn]}>
              <Text style={[styles.fChipText, statusFilter === f && styles.fChipTextOn]}>{f === 'all' ? 'All' : statusLabel(f)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.empty}><Ionicons name="clipboard-outline" size={32} color="#e2e8f0" /><Text style={styles.emptyText}>No tasks found.</Text></View>
        ) : (
          filtered.map((task, idx) => {
            const isOverdue = task.due_date ? new Date(task.due_date) < new Date() && task.status !== 'completed' : false
            const prio = getPriorityStyle(task.priority)
            const sc = getStatusStyle(task.status)

            return (
              <Animated.View key={task.id} entering={FadeInDown.delay(idx * 40)} layout={LinearTransition}>
                <Pressable style={styles.card} onPress={() => router.push(`/task/${task.id}` as Href)}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{task.title}</Text>
                    <View style={[styles.statusTag, { backgroundColor: isOverdue ? '#fee2e2' : sc.bg }]}><Text style={[styles.statusTagText, { color: isOverdue ? '#991b1b' : sc.text }]}>{isOverdue ? 'Overdue' : statusLabel(task.status)}</Text></View>
                  </View>
                  <Text style={styles.cardDesc} numberOfLines={2}>{task.description || 'No description provided.'}</Text>
                  <View style={styles.cardFooter}>
                    <View style={[styles.prioTag, { backgroundColor: prio.bg }]}>
                      <View style={[styles.prioDot, { backgroundColor: prio.dot }]} />
                      <Text style={[styles.prioTagText, { color: prio.text }]}>{task.priority || 'None'}</Text>
                    </View>
                    {task.due_date && (
                      <View style={styles.dueTag}>
                        <Ionicons name="calendar-outline" size={11} color={isOverdue ? '#dc2626' : palette.muted} />
                        <Text style={[styles.dueText, isOverdue && { color: '#dc2626' }]}>{new Date(task.due_date).toLocaleDateString()}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }} />
                    <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                  </View>
                </Pressable>
              </Animated.View>
            )
          })
        )}
      </ScrollView>

      <CreateTaskModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={loadTasks} onCreateProject={() => setShowProjectCreate(true)} />
      <CreateProjectModal visible={showProjectCreate} onClose={() => setShowProjectCreate(false)} onCreated={loadTasks} />
      <CreateTeamModal visible={showTeamCreate} onClose={() => setShowTeamCreate(false)} onCreated={loadTasks} onCreateProject={() => setShowProjectCreate(true)} />
      <InviteMemberModal visible={showMemberInvite} onClose={() => setShowMemberInvite(false)} onCreated={loadTasks} onCreateProject={() => setShowProjectCreate(true)} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: palette.text, letterSpacing: -1 },
  headerSub: { fontSize: 11, fontWeight: '900', color: palette.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 },

  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, shadowColor: palette.primary, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  createBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: palette.surface, borderRadius: 18, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(148,163,184,0.1)' },
  statVal: { fontSize: 24, fontWeight: '900', color: palette.text },
  statLab: { fontSize: 9, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },

  filterScroll: { maxHeight: 52, flexGrow: 0, marginBottom: 12 },
  filterRow: { paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  fChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: palette.surface, borderWidth: 1, borderColor: 'rgba(148,163,184,0.1)' },
  fChipOn: { backgroundColor: palette.primary, borderColor: palette.primary },
  fChipText: { fontSize: 9, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  fChipTextOn: { color: '#fff' },

  card: { backgroundColor: palette.surface, borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(148,163,184,0.1)', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 17, fontWeight: '900', color: palette.text, flex: 1, letterSpacing: -0.5 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusTagText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardDesc: { fontSize: 14, color: palette.muted, fontWeight: '600', lineHeight: 20, marginBottom: 16 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prioTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  prioDot: { width: 6, height: 6, borderRadius: 3 },
  prioTagText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  dueTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dueText: { fontSize: 11, fontWeight: '700', color: palette.muted },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, color: palette.muted, fontWeight: '600', fontStyle: 'italic' },
})
