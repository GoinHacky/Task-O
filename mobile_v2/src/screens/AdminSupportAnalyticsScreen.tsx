import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { supabase } from '@/src/lib/supabase'
import { SupportRequest } from '@/src/types'
import { palette } from '@/src/theme'

export default function AdminSupportAnalyticsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [rows, setRows] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setAllowed(false)
      setLoading(false)
      return
    }
    const { data: profile } = await supabase.from('users').select('is_platform_admin').eq('id', user.id).single()
    if (!profile?.is_platform_admin) {
      setAllowed(false)
      setLoading(false)
      return
    }
    setAllowed(true)
    const { data } = await supabase.from('support_requests').select('*')
    setRows((data || []) as SupportRequest[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const total = rows.length
  const open = rows.filter(r => r.status !== 'Closed' && r.status !== 'Resolved').length
  const critical = rows.filter(r => r.severity === 'Critical').length
  const uniqueUsers = new Set(rows.map(r => (r as SupportRequest & { user_id?: string }).user_id).filter(Boolean)).size

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  if (!allowed) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <ScreenHeader title="Analytics" onBack={() => router.back()} />
        <Text style={styles.denied}>Access denied.</Text>
      </View>
    )
  }

  const stat = (label: string, value: number) => (
    <View key={label} style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statVal}>{value}</Text>
    </View>
  )

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader title="Support analytics" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.lead}>Platform support volume and severity (from existing tickets).</Text>
        <View style={styles.grid}>
          {stat('Total volume', total)}
          {stat('Open / pending', open)}
          {stat('Critical', critical)}
          {stat('Unique reporters', uniqueUsers)}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  denied: { padding: 24, fontSize: 15, color: palette.muted, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 40 },
  lead: { fontSize: 14, color: palette.muted, fontWeight: '600', marginBottom: 16, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    width: '47%',
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statLabel: { fontSize: 10, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  statVal: { fontSize: 28, fontWeight: '900', color: palette.text, marginTop: 8 },
})
