import { Ionicons } from '@expo/vector-icons'
import { type Href, useRouter, useNavigation } from 'expo-router'
import { DrawerActions } from '@react-navigation/native'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { supabase } from '@/src/lib/supabase'
import { SupportRequest } from '@/src/types'
import { palette } from '@/src/theme'

const CATEGORIES = ['Bug', 'UI Issue', 'Performance', 'Suggestion', 'Other'] as const
const PAGES = ['Dashboard', 'Boards', 'Tasks', 'Inbox', 'Login', 'Settings', 'Other'] as const
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const

export default function SupportListScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [rows, setRows] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Bug')
  const [where, setWhere] = useState<(typeof PAGES)[number]>('Dashboard')
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>('Medium')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setRows([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('support_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRows((data || []) as SupportRequest[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function submit() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !title.trim() || !description.trim()) {
      Alert.alert('Missing', 'Title and description are required.')
      return
    }
    setSubmitting(true)
    const { data, error } = await supabase
      .from('support_requests')
      .insert({
        title: title.trim(),
        description: description.trim(),
        category,
        where_did_it_happen: where,
        severity,
        user_id: user.id,
        status: 'Open',
        page_url: 'task-o-mobile',
        browser_info: { platform: 'react-native' },
      })
      .select('ticket_id,id')
      .single()
    setSubmitting(false)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    setModal(false)
    setTitle('')
    setDescription('')
    load()
    if (data?.id) router.push(`/support/${String(data.id)}` as Href)
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Support"
        onMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
      <Pressable style={styles.newBtn} onPress={() => setModal(true)}>
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.newBtnText}>New request</Text>
      </Pressable>
      <Text style={styles.kicker}>My support requests</Text>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tickets yet</Text>
            <Text style={styles.emptyText}>Report bugs or suggestions — we read every ticket.</Text>
          </View>
        ) : (
          rows.map(r => (
            <Pressable key={r.id} style={styles.card} onPress={() => router.push(`/support/${r.id}` as Href)}>
              <Text style={styles.cardTitle}>{r.title}</Text>
              <Text style={styles.cardMeta}>
                {r.ticket_id || r.id.slice(0, 8)} · {r.status} · {r.severity}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <View style={[styles.modalSafe, { paddingTop: insets.top }]}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>New ticket</Text>
            <Pressable onPress={() => setModal(false)}>
              <Ionicons name="close" size={26} color={palette.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Short summary" />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { minHeight: 100 }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="What happened?"
            />
            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {CATEGORIES.map(c => (
                <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipOn]}>
                  <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Where</Text>
            <View style={styles.chips}>
              {PAGES.map(c => (
                <Pressable key={c} onPress={() => setWhere(c)} style={[styles.chip, where === c && styles.chipOn]}>
                  <Text style={[styles.chipText, where === c && styles.chipTextOn]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Severity</Text>
            <View style={styles.chips}>
              {SEVERITIES.map(c => (
                <Pressable key={c} onPress={() => setSeverity(c)} style={[styles.chip, severity === c && styles.chipOn]}>
                  <Text style={[styles.chipText, severity === c && styles.chipTextOn]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.submit} disabled={submitting} onPress={submit}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
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
  title: { fontSize: 20, fontWeight: '900', color: palette.text },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: palette.primaryMid,
  },
  newBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  kicker: {
    paddingHorizontal: 16,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: palette.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: palette.text },
  cardMeta: { fontSize: 12, color: palette.muted, marginTop: 6, fontWeight: '600' },
  empty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.border,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: palette.text },
  emptyText: { marginTop: 8, color: palette.muted, textAlign: 'center' },
  modalSafe: { flex: 1, backgroundColor: palette.bg },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.surface,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  label: { fontSize: 11, fontWeight: '900', color: palette.muted, marginTop: 12, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: palette.surface,
    color: palette.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  chipOn: { borderColor: palette.accent, backgroundColor: palette.accentSoft },
  chipText: { fontSize: 12, fontWeight: '700', color: palette.muted },
  chipTextOn: { color: palette.primaryMid },
  submit: {
    marginTop: 24,
    backgroundColor: palette.primaryMid,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '900' },
})
