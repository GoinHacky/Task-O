import { useRouter } from 'expo-router'
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

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { TaskOLogo } from '@/src/components/TaskOLogo'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type ProjectRow = { id: string; name: string }

export default function InviteScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [projectId, setProjectId] = useState('')
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data: mem } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
    const pids = [...new Set((mem || []).map(m => (m as { project_id: string }).project_id).filter(Boolean))]
    const { data: fromMem } =
      pids.length > 0 ? await supabase.from('projects').select('id, name').in('id', pids) : { data: [] }
    const list: ProjectRow[] = ((fromMem || []) as ProjectRow[]).slice()
    const { data: owned } = await supabase.from('projects').select('id, name').eq('owner_id', user.id)
    for (const o of owned || []) {
      const row = o as ProjectRow
      if (!list.find(x => x.id === row.id)) list.push(row)
    }
    setProjects(list)
    if (list.length === 1) setProjectId(list[0].id)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function send() {
    if (!email.trim() || !projectId) {
      Alert.alert('Missing info', 'Choose a project and enter an email.')
      return
    }
    setSending(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSending(false)
      return
    }
    const { data: target } = await supabase.from('users').select('id, full_name').ilike('email', email.trim()).maybeSingle()
    if (!target) {
      setSending(false)
      Alert.alert('Not found', 'User must already have an account.')
      return
    }
    const tid = (target as { id: string }).id
    const { data: existing } = await supabase
      .from('project_members')
      .select('status')
      .eq('project_id', projectId)
      .eq('user_id', tid)
      .maybeSingle()
    if (existing) {
      setSending(false)
      Alert.alert('Already invited or member')
      return
    }
    const { error } = await supabase.from('project_members').insert({
      project_id: projectId,
      user_id: tid,
      role: role === 'viewer' ? 'member' : role,
      status: 'pending',
    })
    if (error) {
      setSending(false)
      Alert.alert('Error', error.message)
      return
    }
    const { data: proj } = await supabase.from('projects').select('name').eq('id', projectId).single()
    const { data: inviter } = await supabase.from('users').select('full_name').eq('id', user.id).single()
    const pn = (proj as { name: string } | null)?.name || 'project'
    await supabase.from('notifications').insert({
      user_id: tid,
      type: 'invite',
      message: `You've been invited to join ${pn} by ${(inviter as { full_name: string } | null)?.full_name || 'a teammate'}`,
      related_id: projectId,
      read: false,
      metadata: { project_name: pn },
    })
    setSending(false)
    setEmail('')
    Alert.alert('Invitation sent')
  }

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader title="Invite" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <TaskOLogo size={40} rounded={18} />
          <Text style={styles.brandText}>Invite someone to a project they can help with.</Text>
        </View>

        <Text style={styles.label}>Project</Text>
        <View style={styles.row}>
          {projects.map(p => (
            <Pressable key={p.id} onPress={() => setProjectId(p.id)} style={[styles.chip, projectId === p.id && styles.chipOn]}>
              <Text style={[styles.chipText, projectId === p.id && styles.chipTextOn]} numberOfLines={1}>
                {p.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="teammate@company.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Role</Text>
        <View style={styles.row}>
          {(['member', 'admin', 'viewer'] as const).map(r => (
            <Pressable key={r} onPress={() => setRole(r)} style={[styles.chip, role === r && styles.chipOn]}>
              <Text style={[styles.chipText, role === r && styles.chipTextOn]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.send} onPress={send} disabled={sending}>
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send invitation</Text>}
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  body: { padding: 16, paddingBottom: 40 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  brandText: { flex: 1, fontSize: 14, color: palette.muted, fontWeight: '600', lineHeight: 20 },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.muted,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: palette.text,
    backgroundColor: palette.surface,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    maxWidth: '100%',
  },
  chipOn: { borderColor: palette.accent, backgroundColor: palette.accentSoft },
  chipText: { fontSize: 12, fontWeight: '700', color: palette.muted, textTransform: 'capitalize' },
  chipTextOn: { color: palette.primaryMid },
  send: {
    marginTop: 24,
    backgroundColor: palette.primaryMid,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  sendText: { color: '#fff', fontWeight: '900', fontSize: 15 },
})
