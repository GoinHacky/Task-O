import { Ionicons } from '@expo/vector-icons'
import { type Href, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { DrawerScreenHeader } from '@/src/components/ScreenHeader'
import { SelectorModal } from '@/src/components/SelectorModal'
import { ListSkeleton } from '@/src/components/Skeleton'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { FadeIn } from '@/src/components/FadeIn'
import { supabase } from '@/src/lib/supabase'
import { SupportRequest } from '@/src/types'
import { palette } from '@/src/theme'

const CATEGORIES = ['Bug', 'UI Issue', 'Performance', 'Suggestion', 'Other'] as const
const PAGES = ['Dashboard', 'Boards', 'Tasks', 'Inbox', 'Login', 'Settings', 'Other'] as const
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const

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

export default function SupportListScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [rows, setRows] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('Bug')
  const [where, setWhere] = useState<string>('Dashboard')
  const [severity, setSeverity] = useState<string>('Medium')
  const [submitting, setSubmitting] = useState(false)
  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)

  const [selVisible, setSelVisible] = useState(false)
  const [selTitle, setSelTitle] = useState('')
  const [selOptions, setSelOptions] = useState<{ id: string; label: string }[]>([])
  const [selVal, setSelVal] = useState<string | null>(null)
  const [onSel, setOnSel] = useState<(v: any) => void>(() => {})

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setRows([]); setLoading(false); return }
    const { data } = await supabase
      .from('support_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRows((data || []) as SupportRequest[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openSelector(
    t: string,
    opts: { id: string; label: string }[],
    val: string | null,
    setter: (v: any) => void,
  ) {
    setSelTitle(t)
    setSelOptions(opts)
    setSelVal(val)
    setOnSel(() => setter)
    setSelVisible(true)
  }

  async function submit() {
    const { data: { user } } = await supabase.auth.getUser()
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
    if (error) { Alert.alert('Error', error.message); return }
    setModal(false)
    resetForm()
    load()
    if (data?.id) router.push(`/support/${String(data.id)}` as Href)
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setCategory('Bug')
    setWhere('Dashboard')
    setSeverity('Medium')
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <DrawerScreenHeader
        title="Support"
        onAddTask={() => setTaskModal(true)}
        onAddProject={() => setProjectModal(true)}
        onAddTeam={() => setTeamModal(true)}
        onAddMember={() => setMemberModal(true)}
      />
      {loading ? (
        <ListSkeleton />
      ) : (
        <FadeIn>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.shell}>
              <View style={styles.hero}>
                <Text style={styles.heroTitle}>Support</Text>
                <Text style={styles.heroSub}>
                  Report issues or send feedback to help us improve the platform.
                </Text>
                <Pressable style={styles.primaryBtn} onPress={() => setModal(true)}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>New Support Request</Text>
                </Pressable>
              </View>

              <Text style={styles.kicker}>My Support Requests</Text>

              {rows.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.qBox}>
                    <Text style={styles.qText}>?</Text>
                  </View>
                  <Text style={styles.emptyTitleWide}>You haven't submitted any support requests yet.</Text>
                  <Text style={styles.emptyDescWide}>
                    If you encounter any bugs or have suggestions for improvement, we're here to help!
                  </Text>
                </View>
              ) : (
                rows.map(r => (
                  <Pressable key={r.id} style={styles.card} onPress={() => router.push(`/support/${r.id}` as Href)}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{r.title}</Text>
                      <Ionicons name="chevron-forward" size={16} color={palette.muted} />
                    </View>
                    <View style={styles.cardMeta}>
                      <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>{r.ticket_id || r.id.slice(0, 8)}</Text>
                      </View>
                      <View style={[styles.metaPill, { backgroundColor: `${statusColor(r.status)}18` }]}>
                        <View style={[styles.metaDot, { backgroundColor: statusColor(r.status) }]} />
                        <Text style={[styles.metaPillText, { color: statusColor(r.status) }]}>{r.status}</Text>
                      </View>
                      <View style={[styles.metaPill, { backgroundColor: `${sevColor(r.severity)}12` }]}>
                        <Text style={[styles.metaPillText, { color: sevColor(r.severity) }]}>{r.severity}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </ScrollView>
        </FadeIn>
      )}

      {/* ─── New Ticket Modal ─── */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalHeaderTitle}>New Ticket</Text>
              <Text style={styles.modalHeaderSub}>DESCRIBE THE ISSUE OR SUGGESTION</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={[styles.input, title.length > 0 && styles.inputActive]}
              placeholder="Short summary of the issue..."
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.grid}>
              <View style={styles.col}>
                <Text style={styles.label}>Category</Text>
                <Pressable
                  onPress={() => openSelector(
                    'Select Category',
                    CATEGORIES.map(c => ({ id: c, label: c })),
                    category,
                    setCategory,
                  )}
                  style={styles.select}
                >
                  <Text style={styles.selectText}>{category}</Text>
                  <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                </Pressable>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Severity</Text>
                <Pressable
                  onPress={() => openSelector(
                    'Select Severity',
                    SEVERITIES.map(s => ({ id: s, label: s })),
                    severity,
                    setSeverity,
                  )}
                  style={styles.select}
                >
                  <Text style={[styles.selectText, { color: sevColor(severity) }]}>{severity}</Text>
                  <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                </Pressable>
              </View>
            </View>

            <Text style={styles.label}>Location</Text>
            <Pressable
              onPress={() => openSelector(
                'Where did it happen?',
                PAGES.map(p => ({ id: p, label: p })),
                where,
                setWhere,
              )}
              style={styles.select}
            >
              <Text style={styles.selectText}>{where}</Text>
              <Ionicons name="chevron-down" size={16} color="#94a3b8" />
            </Pressable>

            <Text style={styles.label}>Description *</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.multiline]}
              placeholder="What happened? Steps to reproduce, expected behavior..."
              placeholderTextColor="#9ca3af"
              multiline
            />

            <Pressable style={styles.cta} disabled={submitting} onPress={submit}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>Submit Ticket</Text>
              )}
            </Pressable>
          </ScrollView>

          <SelectorModal
            visible={selVisible}
            title={selTitle}
            options={selOptions}
            selectedValue={selVal}
            onSelect={onSel}
            onClose={() => setSelVisible(false)}
          />
        </KeyboardAvoidingView>
      </Modal>

      <CreateTaskModal visible={taskModal} onClose={() => setTaskModal(false)} onCreated={() => setTaskModal(false)} />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onCreated={() => setProjectModal(false)} />
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreated={() => setTeamModal(false)} />
      <InviteMemberModal visible={memberModal} onClose={() => setMemberModal(false)} onCreated={() => setMemberModal(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: 16, paddingBottom: 60 },
  shell: { width: '100%', maxWidth: 1400, alignSelf: 'center' },
  hero: {
    paddingTop: 8,
    paddingBottom: 22,
  },
  heroTitle: { fontSize: 38, fontWeight: '900', color: palette.text, letterSpacing: -1 },
  heroSub: { marginTop: 10, fontSize: 14, color: palette.muted, fontWeight: '600', lineHeight: 20, maxWidth: 520 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: palette.primaryMid,
    borderRadius: 18,
    shadowColor: palette.primaryMid,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 5,
  },
  primaryBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 0.6 },
  kicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3.2,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: palette.text, flex: 1, marginRight: 8 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  metaDot: { width: 6, height: 6, borderRadius: 3 },
  metaPillText: { fontSize: 10, fontWeight: '800', color: palette.muted, letterSpacing: 0.3 },
  emptyCard: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    paddingVertical: 60,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 420,
  },
  qBox: {
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: 'rgba(148,163,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  qText: { fontSize: 32, fontWeight: '900', color: '#cbd5e1' },
  emptyTitleWide: { fontSize: 18, fontWeight: '900', color: palette.text, textAlign: 'center', marginBottom: 10, maxWidth: 360, lineHeight: 24 },
  emptyDescWide: { fontSize: 13, fontWeight: '600', color: palette.muted, textAlign: 'center', lineHeight: 20, maxWidth: 320 },

  /* ─── Modal ─── */
  sheet: { flex: 1, backgroundColor: palette.bg },
  modalHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: palette.bg,
  },
  modalHeaderContent: { alignItems: 'center' },
  modalHeaderTitle: { fontSize: 26, fontWeight: '900', color: '#1e293b', letterSpacing: -1 },
  modalHeaderSub: { fontSize: 11, fontWeight: '900', color: '#94a3b8', marginTop: 8, letterSpacing: 1 },
  modalBody: { paddingHorizontal: 24, paddingBottom: 60 },
  grid: { flexDirection: 'row', gap: 12, marginTop: 4 },
  col: { flex: 1 },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: '#f8fafc',
    color: palette.text,
    fontWeight: '600',
  },
  inputActive: {
    borderColor: palette.accent,
    backgroundColor: '#fff',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
  },
  selectText: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  multiline: { height: 120, textAlignVertical: 'top' },
  cta: {
    marginTop: 24,
    backgroundColor: palette.primaryMid,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: palette.primaryMid,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
})
