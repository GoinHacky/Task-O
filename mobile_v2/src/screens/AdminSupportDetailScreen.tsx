import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { supabase } from '@/src/lib/supabase'
import { SupportComment, SupportRequest } from '@/src/types'
import { palette } from '@/src/theme'

const STATUSES = ['Open', 'Reviewed', 'In Progress', 'Resolved', 'Closed'] as const

export default function AdminSupportDetailScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [req, setReq] = useState<SupportRequest | null>(null)
  const [requester, setRequester] = useState<{ full_name: string | null; email: string | null } | null>(null)
  const [comments, setComments] = useState<SupportComment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [adminNote, setAdminNote] = useState(true)
  const [allowed, setAllowed] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
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

    const { data: r } = await supabase.from('support_requests').select('*').eq('id', id).single()
    setReq((r as SupportRequest) || null)
    const uid = (r as { user_id?: string } | null)?.user_id
    if (uid) {
      const { data: u } = await supabase.from('users').select('full_name, email').eq('id', uid).single()
      setRequester(u as { full_name: string | null; email: string | null })
    }
    const { data: c } = await supabase.from('support_comments').select('*').eq('request_id', id).order('created_at', { ascending: true })
    setComments((c || []) as SupportComment[])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function send() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !id || !text.trim()) return
    const { error } = await supabase.from('support_comments').insert({
      request_id: id,
      user_id: user.id,
      content: text.trim(),
      is_admin_note: adminNote,
    })
    if (error) Alert.alert('Error', error.message)
    else {
      setText('')
      load()
    }
  }

  async function setStatus(status: (typeof STATUSES)[number]) {
    if (!id) return
    const { error } = await supabase
      .from('support_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) Alert.alert('Error', error.message)
    else load()
  }

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
        <ScreenHeader title="Admin" onBack={() => router.back()} />
        <Text style={styles.denied}>Access denied.</Text>
      </View>
    )
  }

  if (!req) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <ScreenHeader title="Ticket" onBack={() => router.back()} />
        <Text style={styles.denied}>Ticket not found.</Text>
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader title="Admin" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{req.title}</Text>
        <Text style={styles.meta}>
          {req.ticket_id || req.id.slice(0, 8)} · {req.status} · {req.category} · {req.severity}
        </Text>
        {requester ? (
          <Text style={styles.req}>
            Requester: {requester.full_name || requester.email || '—'}
          </Text>
        ) : null}
        <Text style={styles.desc}>{req.description}</Text>

        <Text style={styles.section}>Status</Text>
        <View style={styles.statusRow}>
          {STATUSES.map(s => (
            <Pressable key={s} onPress={() => setStatus(s)} style={[styles.stChip, req.status === s && styles.stChipOn]}>
              <Text style={[styles.stText, req.status === s && styles.stTextOn]}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Thread</Text>
        {comments.map(c => (
          <View key={c.id} style={[styles.bubble, c.is_admin_note && styles.bubbleAdmin]}>
            {c.is_admin_note ? <Text style={styles.adminTag}>Internal</Text> : null}
            <Text style={styles.bubbleText}>{c.content}</Text>
            <Text style={styles.bubbleTime}>{new Date(c.created_at).toLocaleString()}</Text>
          </View>
        ))}

        <View style={styles.noteRow}>
          <Text style={styles.noteLabel}>Internal note</Text>
          <Switch value={adminNote} onValueChange={setAdminNote} />
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Reply or internal note…"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          multiline
        />
        <Pressable style={styles.sendBtn} onPress={send}>
          <Text style={styles.sendBtnText}>Send</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  denied: { padding: 24, fontSize: 15, color: palette.muted, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '900', color: palette.text },
  meta: { fontSize: 12, color: palette.muted, marginTop: 8, fontWeight: '600' },
  req: { fontSize: 14, color: palette.text, marginTop: 10, fontWeight: '700' },
  desc: { fontSize: 15, color: palette.text, marginTop: 12, lineHeight: 22 },
  section: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.muted,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  stChipOn: { borderColor: palette.primaryMid, backgroundColor: palette.accentSoft },
  stText: { fontSize: 10, fontWeight: '800', color: palette.muted },
  stTextOn: { color: palette.primaryMid },
  bubble: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  bubbleAdmin: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  adminTag: { fontSize: 10, fontWeight: '900', color: '#b45309', marginBottom: 6 },
  bubbleText: { fontSize: 14, color: palette.text, fontWeight: '600' },
  bubbleTime: { fontSize: 11, color: palette.muted, marginTop: 6 },
  noteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  noteLabel: { fontSize: 14, fontWeight: '800', color: palette.text },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 12,
    minHeight: 88,
    textAlignVertical: 'top',
    backgroundColor: palette.surface,
    color: palette.text,
    marginTop: 8,
  },
  sendBtn: {
    marginTop: 12,
    backgroundColor: palette.primaryMid,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontWeight: '800' },
})
