import { Ionicons } from '@expo/vector-icons'
import { type Href, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, done: 0, doing: 0, pending: 0 })

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
    if (project) {
      setName(project.name)
      setDescription(project.description)
    }
    const { data: taskRows } = await supabase.from('tasks').select('status').eq('project_id', id)
    const list = taskRows || []
    const total = list.length
    const done = list.filter((t: { status: string }) => t.status === 'completed').length
    const doing = list.filter((t: { status: string }) => t.status === 'in_progress').length
    const pending = list.filter((t: { status: string }) => t.status === 'pending' || t.status === 'review').length
    setStats({ total, done, doing, pending })
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  const health = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {name || 'Project'}
        </Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.integrity}>
          <Text style={styles.integrityK}>Project health</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${health}%`, backgroundColor: health > 60 ? '#10b981' : '#f59e0b' }]} />
          </View>
          <Text style={styles.integrityV}>{health}% complete</Text>
        </View>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
        <View style={styles.grid}>
          {[
            ['Total tasks', String(stats.total)],
            ['Completed', String(stats.done)],
            ['In progress', String(stats.doing)],
            ['Pending / review', String(stats.pending)],
          ].map(([k, v]) => (
            <View key={k} style={styles.statBox}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statKey}>{k}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionLabel}>Project workspace</Text>
        {(
          [
            ['people-outline', 'Members & invites', `/project/${id}/members`],
            ['people-circle-outline', 'Teams', `/project/${id}/teams`],
            ['list-outline', 'All tasks', `/project/${id}/tasks`],
            ['pulse-outline', 'Activity', `/project/${id}/activities`],
            ['bar-chart-outline', 'Reports', `/project/${id}/reports`],
            ['calendar-outline', 'Calendar', `/project/${id}/calendar`],
            ['clipboard-outline', 'Kanban', `/kanban?projectId=${id}`],
            ['create-outline', 'New task', `/task/new?projectId=${id}`],
            ['settings-outline', 'Settings', `/project/${id}/settings`],
            ['color-wand-outline', 'Edit project', `/project/${id}/edit`],
          ] as const
        ).map(([icon, label, path]) => (
          <Pressable
            key={label}
            style={styles.linkBtn}
            onPress={() => router.push(path as Href)}
          >
            <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={palette.primaryMid} />
            <Text style={styles.linkText}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.surface,
  },
  back: { padding: 6 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: palette.text },
  body: { padding: 16, paddingBottom: 40 },
  integrity: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 14,
  },
  integrityK: { fontSize: 10, fontWeight: '900', color: palette.muted, letterSpacing: 1, textTransform: 'uppercase' },
  barBg: {
    height: 6,
    borderRadius: 99,
    backgroundColor: '#f1f5f9',
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 99 },
  integrityV: { marginTop: 8, fontSize: 13, fontWeight: '700', color: palette.text },
  desc: { fontSize: 15, color: palette.muted, lineHeight: 22, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    width: '47%',
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statVal: { fontSize: 22, fontWeight: '900', color: palette.text },
  statKey: { fontSize: 11, color: palette.muted, marginTop: 4, fontWeight: '600' },
  linkBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  linkText: { flex: 1, fontSize: 15, fontWeight: '700', color: palette.text },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.muted,
  },
})
