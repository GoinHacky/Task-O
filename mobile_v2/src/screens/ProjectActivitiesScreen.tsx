import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type ActivityRow = {
  id: string
  type: string
  message: string
  created_at: string
}

export default function ProjectActivitiesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id: projectId } = useLocalSearchParams<{ id: string }>()
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('activities')
      .select('id, type, message, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(100)
    setRows((data || []) as ActivityRow[])
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
      <ScreenHeader title="Activity" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        {rows.length === 0 ? <Text style={styles.empty}>No activity yet.</Text> : null}
        {rows.map(a => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.type}>{a.type.replace(/_/g, ' ')}</Text>
            <Text style={styles.msg}>{a.message}</Text>
            <Text style={styles.time}>{new Date(a.created_at).toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  body: { padding: 16, paddingBottom: 40 },
  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    marginBottom: 10,
  },
  type: { fontSize: 10, fontWeight: '900', color: palette.accent, textTransform: 'uppercase', letterSpacing: 0.8 },
  msg: { fontSize: 15, fontWeight: '700', color: palette.text, marginTop: 6 },
  time: { fontSize: 11, color: palette.muted, marginTop: 8, fontWeight: '600' },
  empty: { textAlign: 'center', color: palette.muted, fontWeight: '600', marginTop: 24 },
})
