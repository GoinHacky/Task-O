import { useRouter, useNavigation } from 'expo-router'
import { DrawerActions } from '@react-navigation/native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
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
import { supabase } from '@/src/lib/supabase'
import { TaskItem } from '@/src/types'
import { palette } from '@/src/theme'

export default function CalendarScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadCalendarItems = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', user.id)
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true })
    setTasks((data || []) as TaskItem[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCalendarItems()
  }, [loadCalendarItems])

  const grouped = useMemo(() => {
    return tasks.reduce<Record<string, TaskItem[]>>((acc, task) => {
      const key = task.due_date ? new Date(task.due_date).toDateString() : 'No due date'
      if (!acc[key]) acc[key] = []
      acc[key].push(task)
      return acc
    }, {})
  }, [tasks])

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        onMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
        onNotification={() => router.push('/notifications')}
        onAddTask={() => setTaskModal(true)}
        onAddProject={() => setProjectModal(true)}
        onAddTeam={() => setTeamModal(true)}
        onAddMember={() => setMemberModal(true)}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadCalendarItems(); setRefreshing(false) }} />
        }
      >
        <Text style={styles.subtitle}>Upcoming due dates from your tasks.</Text>

        {Object.keys(grouped).length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No scheduled tasks</Text>
            <Text style={styles.emptyDesc}>Tasks with due dates will show in this timeline.</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([day, dayTasks]) => (
            <View key={day} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{day}</Text>
              {dayTasks.map(task => (
                <View key={task.id} style={styles.timelineItem}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>{task.status.replace('_', ' ')}</Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <CreateTaskModal visible={taskModal} onClose={() => setTaskModal(false)} onCreated={loadCalendarItems} onCreateProject={() => setProjectModal(true)} />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onCreated={loadCalendarItems} />
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreated={loadCalendarItems} onCreateProject={() => setProjectModal(true)} />
      <InviteMemberModal visible={memberModal} onClose={() => setMemberModal(false)} onCreated={loadCalendarItems} onCreateProject={() => setProjectModal(true)} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: 16, paddingTop: 14, gap: 12, paddingBottom: 120 },
  title: { color: palette.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: palette.muted, marginBottom: 6, fontSize: 14 },
  dayCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: palette.surface,
    padding: 15,
    gap: 9,
  },
  dayTitle: {
    color: palette.primaryMid,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.7,
  },
  timelineItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8edf5',
    padding: 11,
    backgroundColor: '#fafbff',
  },
  taskTitle: { color: palette.text, fontWeight: '800' },
  taskMeta: { marginTop: 2, color: palette.muted, fontSize: 12 },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: { color: palette.text, fontWeight: '800', fontSize: 16 },
  emptyDesc: { marginTop: 4, color: palette.muted, textAlign: 'center' },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg },
})
