import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

export default function ProjectReportsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id: projectId } = useLocalSearchParams<{ id: string }>()
  const [completion, setCompletion] = useState(0)
  const [teamVel, setTeamVel] = useState<{ name: string; v: number }[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }
    const { data: tasks } = await supabase.from('tasks').select('status, team_id').eq('project_id', projectId)
    const list = tasks || []
    const total = list.length
    const done = list.filter((t: { status: string }) => t.status === 'completed').length
    setCompletion(total > 0 ? Math.round((done / total) * 100) : 0)

    const { data: teams } = await supabase.from('teams').select('id, name').eq('project_id', projectId)
    const vel: { name: string; v: number }[] = []
    for (const tm of teams || []) {
      const tid = (tm as { id: string }).id
      const { data: tt } = await supabase.from('tasks').select('status').eq('team_id', tid)
      const tlist = tt || []
      const ttot = tlist.length
      const tdone = tlist.filter((x: { status: string }) => x.status === 'completed').length
      vel.push({ name: (tm as { name: string }).name, v: ttot > 0 ? Math.round((tdone / ttot) * 100) : 0 })
    }
    setTeamVel(vel)
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
      <ScreenHeader title="Reports" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <Text style={styles.heroK}>Completion rate</Text>
          <Text style={styles.heroV}>{completion}%</Text>
        </View>
        <Text style={styles.section}>Velocity by team</Text>
        {teamVel.map(t => (
          <View key={t.name} style={styles.row}>
            <Text style={styles.name}>{t.name}</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${t.v}%` }]} />
            </View>
            <Text style={styles.pct}>{t.v}%</Text>
          </View>
        ))}
        {teamVel.length === 0 ? <Text style={styles.hint}>Create teams to see per-team velocity.</Text> : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  body: { padding: 16, paddingBottom: 40 },
  hero: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroK: { fontSize: 11, fontWeight: '900', color: palette.muted, letterSpacing: 1, textTransform: 'uppercase' },
  heroV: { fontSize: 42, fontWeight: '900', color: palette.primaryMid, marginTop: 8 },
  section: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.muted,
    marginBottom: 12,
  },
  row: { marginBottom: 16 },
  name: { fontSize: 13, fontWeight: '800', color: palette.text, marginBottom: 6 },
  barBg: {
    height: 8,
    borderRadius: 99,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 99 },
  pct: { fontSize: 12, fontWeight: '800', color: palette.muted, marginTop: 6 },
  hint: { color: palette.muted, fontWeight: '600' },
})
