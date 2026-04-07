import { Ionicons } from '@expo/vector-icons'
import { type Href, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '@/src/lib/supabase'
import { SupportRequest } from '@/src/types'
import { palette } from '@/src/theme'

const STATUSES = ['Open', 'Reviewed', 'In Progress', 'Resolved', 'Closed'] as const

export default function AdminSupportScreen() {
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
    const { data } = await supabase.from('support_requests').select('*').order('created_at', { ascending: false }).limit(50)
    setRows((data || []) as SupportRequest[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(id: string, status: (typeof STATUSES)[number]) {
    const { error } = await supabase.from('support_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) Alert.alert('Error', error.message)
    else load()
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  if (!allowed) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.head}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={palette.text} />
          </Pressable>
        </View>
        <Text style={styles.denied}>You don&apos;t have access to the admin support queue.</Text>
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <Text style={styles.title}>Support queue</Text>
        <Pressable onPress={() => router.push('/admin-support/analytics' as Href)} hitSlop={12}>
          <Ionicons name="analytics-outline" size={22} color={palette.primaryMid} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {rows.map(r => (
          <View key={r.id} style={styles.card}>
            <Pressable onPress={() => router.push(`/admin-support/${r.id}` as Href)}>
              <Text style={styles.cardTitle}>{r.title}</Text>
              <Text style={styles.cardMeta}>{r.ticket_id || r.id.slice(0, 8)} · current: {r.status}</Text>
            </Pressable>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
              {STATUSES.map(s => (
                <Pressable key={s} style={[styles.stChip, r.status === s && styles.stChipOn]} onPress={() => setStatus(r.id, s)}>
                  <Text style={[styles.stText, r.status === s && styles.stTextOn]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  title: { fontSize: 18, fontWeight: '900', color: palette.text },
  denied: { padding: 24, fontSize: 16, color: palette.muted, fontWeight: '600' },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: palette.text },
  cardMeta: { fontSize: 12, color: palette.muted, marginTop: 6 },
  stChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
  },
  stChipOn: { borderColor: palette.primaryMid, backgroundColor: palette.accentSoft },
  stText: { fontSize: 11, fontWeight: '800', color: palette.muted },
  stTextOn: { color: palette.primaryMid },
})
