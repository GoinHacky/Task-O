import { type Href, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { supabase } from '@/src/lib/supabase'
import { TaskItem } from '@/src/types'
import { palette } from '@/src/theme'

export default function ProjectTasksScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id: projectId } = useLocalSearchParams<{ id: string }>()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setTasks((data || []) as TaskItem[])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Project tasks"
        onBack={() => router.back()}
        right={
          <Pressable onPress={() => router.push(`/task/new?projectId=${projectId}` as Href)} hitSlop={12}>
            <Text style={styles.add}>+ New</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.body}>
        {tasks.map(t => (
          <Pressable key={t.id} style={styles.card} onPress={() => router.push(`/task/${t.id}` as Href)}>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.meta}>
              {t.status} · {t.priority || '—'}
            </Text>
          </Pressable>
        ))}
        {tasks.length === 0 ? <Text style={styles.empty}>No tasks in this project.</Text> : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  body: { padding: 16, paddingBottom: 40 },
  add: { fontSize: 14, fontWeight: '900', color: palette.primaryMid },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: '800', color: palette.text },
  meta: { fontSize: 12, color: palette.muted, marginTop: 6, fontWeight: '600', textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: palette.muted, fontWeight: '600', marginTop: 20 },
})
