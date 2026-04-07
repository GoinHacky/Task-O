import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { supabase } from '@/src/lib/supabase'
import { TaskItem } from '@/src/types'
import { palette } from '@/src/theme'

export default function ProjectCalendarScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id: projectId } = useLocalSearchParams<{ id: string }>()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true })
    setTasks((data || []) as TaskItem[])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

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
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader title="Project calendar" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              await load()
              setRefreshing(false)
            }}
          />
        }
      >
        {Object.keys(grouped).length === 0 ? (
          <Text style={styles.empty}>No scheduled tasks for this project.</Text>
        ) : (
          Object.entries(grouped).map(([day, dayTasks]) => (
            <View key={day} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{day}</Text>
              {dayTasks.map(t => (
                <View key={t.id} style={styles.task}>
                  <Text style={styles.taskTitle}>{t.title}</Text>
                  <Text style={styles.taskMeta}>{t.status}</Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  content: { padding: 16, paddingBottom: 40 },
  dayCard: { marginBottom: 18 },
  dayTitle: { fontSize: 13, fontWeight: '900', color: palette.muted, marginBottom: 10, textTransform: 'uppercase' },
  task: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    marginBottom: 8,
  },
  taskTitle: { fontSize: 15, fontWeight: '800', color: palette.text },
  taskMeta: { fontSize: 12, color: palette.muted, marginTop: 4, fontWeight: '600', textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: palette.muted, fontWeight: '600', marginTop: 24 },
})
