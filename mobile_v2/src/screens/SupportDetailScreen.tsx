import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { FadeIn } from '@/src/components/FadeIn'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { CardSkeleton } from '@/src/components/Skeleton'
import { supabase } from '@/src/lib/supabase'
import { SupportComment, SupportRequest } from '@/src/types'
import { palette } from '@/src/theme'

function sevColor(s: string) {
  if (s === 'Critical') return '#dc2626'
  if (s === 'High') return '#ea580c'
  if (s === 'Medium') return '#d97706'
  return '#64748b'
}

function statusColor(s: string) {
  if (s === 'Resolved' || s === 'Closed') return palette.success
  if (s === 'In Progress') return palette.primaryMid
  if (s === 'Reviewed') return palette.accent
  return palette.muted
}

export default function SupportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [req, setReq] = useState<SupportRequest | null>(null)
  const [comments, setComments] = useState<SupportComment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return }
    const { data: r } = await supabase.from('support_requests').select('*').eq('id', id).single()
    setReq((r as SupportRequest) || null)
    const { data: c } = await supabase
      .from('support_comments')
      .select('*')
      .eq('request_id', id)
      .order('created_at', { ascending: true })
    setComments((c || []) as SupportComment[])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function send() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !id || !text.trim()) return
    const { error } = await supabase.from('support_comments').insert({
      request_id: id,
      user_id: user.id,
      content: text.trim(),
      is_admin_note: false,
    })
    if (error) Alert.alert('Error', error.message)
    else { setText(''); load() }
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader title="Ticket" onBack={() => router.back()} showNotification={false} />
      {loading || !req ? (
        <CardSkeleton />
      ) : (
        <FadeIn>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {/* ─── Ticket Info Card ─── */}
            <View style={styles.infoCard}>
              <Text style={styles.title}>{req.title}</Text>

              <View style={styles.pillRow}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{req.ticket_id || req.id.slice(0, 8)}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: `${statusColor(req.status)}18` }]}>
                  <View style={[styles.pillDot, { backgroundColor: statusColor(req.status) }]} />
                  <Text style={[styles.pillText, { color: statusColor(req.status) }]}>{req.status}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: `${sevColor(req.severity)}12` }]}>
                  <Text style={[styles.pillText, { color: sevColor(req.severity) }]}>{req.severity}</Text>
                </View>
                {req.category ? (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{req.category}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.desc}>{req.description}</Text>

              {req.where_did_it_happen ? (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={palette.muted} />
                  <Text style={styles.metaText}>{req.where_did_it_happen}</Text>
                </View>
              ) : null}
            </View>

            {/* ─── Conversation ─── */}
            <Text style={styles.section}>Conversation</Text>

            {comments.length === 0 ? (
              <View style={styles.emptyThread}>
                <Ionicons name="chatbubbles-outline" size={28} color="#e2e8f0" />
                <Text style={styles.emptyThreadText}>No replies yet. Start the conversation below.</Text>
              </View>
            ) : (
              comments.map(c => (
                <View key={c.id} style={[styles.bubble, c.is_admin_note && styles.bubbleAdmin]}>
                  {c.is_admin_note ? (
                    <View style={styles.adminTagRow}>
                      <Ionicons name="shield-checkmark" size={12} color="#b45309" />
                      <Text style={styles.adminTag}>Team</Text>
                    </View>
                  ) : null}
                  <Text style={styles.bubbleText}>{c.content}</Text>
                  <Text style={styles.bubbleTime}>{new Date(c.created_at).toLocaleString()}</Text>
                </View>
              ))
            )}

            {/* ─── Reply ─── */}
            <Text style={styles.section}>Reply</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write a reply..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
              multiline
            />
            <Pressable style={styles.cta} onPress={send}>
              <Ionicons name="send" size={16} color="#fff" />
              <Text style={styles.ctaText}>Send Reply</Text>
            </Pressable>
          </ScrollView>
        </FadeIn>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  body: { padding: 16, paddingBottom: 60 },

  infoCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    marginBottom: 6,
  },
  title: { fontSize: 20, fontWeight: '900', color: palette.text, marginBottom: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: '800', color: palette.muted, letterSpacing: 0.3 },
  desc: { fontSize: 14, fontWeight: '600', color: palette.text, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  metaText: { fontSize: 11, fontWeight: '700', color: palette.muted },

  section: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  emptyThread: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  emptyThreadText: { fontSize: 12, fontWeight: '600', color: palette.muted, textAlign: 'center' },
  bubble: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    marginBottom: 10,
  },
  bubbleAdmin: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  adminTagRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  adminTag: { fontSize: 10, fontWeight: '900', color: '#b45309' },
  bubbleText: { fontSize: 14, fontWeight: '600', color: palette.text, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: palette.muted, fontWeight: '600', marginTop: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#f8fafc',
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  cta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.primaryMid,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: palette.primaryMid,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
})
