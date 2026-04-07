import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '@/src/lib/supabase'
import { SupportComment, SupportRequest } from '@/src/types'
import { palette } from '@/src/theme'

export default function SupportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [req, setReq] = useState<SupportRequest | null>(null)
  const [comments, setComments] = useState<SupportComment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    const { data: r } = await supabase.from('support_requests').select('*').eq('id', id).single()
    setReq((r as SupportRequest) || null)
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
      is_admin_note: false,
    })
    if (error) Alert.alert('Error', error.message)
    else {
      setText('')
      load()
    }
  }

  if (loading || !req) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <Text style={styles.headTitle} numberOfLines={1}>
          Ticket
        </Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{req.title}</Text>
        <Text style={styles.meta}>
          {req.ticket_id || req.id.slice(0, 8)} · {req.status} · {req.category} · {req.severity}
        </Text>
        <Text style={styles.desc}>{req.description}</Text>

        <Text style={styles.section}>Conversation</Text>
        {comments.map(c => (
          <View key={c.id} style={[styles.bubble, c.is_admin_note && styles.bubbleAdmin]}>
            {c.is_admin_note ? <Text style={styles.adminTag}>Team</Text> : null}
            <Text style={styles.bubbleText}>{c.content}</Text>
            <Text style={styles.bubbleTime}>{new Date(c.created_at).toLocaleString()}</Text>
          </View>
        ))}

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a reply..."
          placeholderTextColor="#94a3b8"
          style={styles.input}
          multiline
        />
        <Pressable style={styles.send} onPress={send}>
          <Text style={styles.sendText}>Send reply</Text>
        </Pressable>
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
  headTitle: { flex: 1, textAlign: 'center', fontWeight: '800', fontSize: 16 },
  body: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '900', color: palette.text },
  meta: { fontSize: 12, color: palette.muted, marginTop: 8, fontWeight: '600' },
  desc: { fontSize: 15, color: palette.text, marginTop: 14, lineHeight: 22 },
  section: {
    marginTop: 24,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    color: palette.muted,
    textTransform: 'uppercase',
  },
  bubble: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 10,
  },
  bubbleAdmin: { backgroundColor: '#fffbeb', borderColor: '#fcd34d' },
  adminTag: { fontSize: 10, fontWeight: '900', color: '#b45309', marginBottom: 6 },
  bubbleText: { fontSize: 14, color: palette.text },
  bubbleTime: { fontSize: 11, color: palette.muted, marginTop: 6 },
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
  send: {
    marginTop: 10,
    backgroundColor: palette.primaryMid,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  sendText: { color: '#fff', fontWeight: '800' },
})
