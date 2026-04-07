import { type Href, useLocalSearchParams, useRouter } from 'expo-router'
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
import { supabase } from '@/src/lib/supabase'
import { TaskItem } from '@/src/types'
import { palette } from '@/src/theme'

export default function ProjectTeamDetailScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { teamId } = useLocalSearchParams<{ id: string; teamId: string }>()
  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState<
    { id: string; role: string; full_name: string | null; email: string | null }[]
  >([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [canAdmin, setCanAdmin] = useState(false)

  const load = useCallback(async () => {
    if (!teamId) {
      setLoading(false)
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single()
    if (team) setTeamName((team as { name: string }).name)

    const { data: tm } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user?.id || '')
      .maybeSingle()
    setCanAdmin(['owner', 'admin'].includes((tm as { role: string } | null)?.role || ''))

    const { data: mem } = await supabase.from('team_members').select('id, role, user_id').eq('team_id', teamId)
    const ids = (mem || []).map(m => (m as { user_id: string }).user_id).filter(Boolean)
    const { data: users } = await supabase.from('users').select('id, full_name, email').in('id', ids)
    const umap = new Map((users || []).map(u => [(u as { id: string }).id, u as { full_name: string | null; email: string | null }]))
    setMembers(
      (mem || []).map(m => {
        const row = m as { id: string; role: string; user_id: string }
        const u = umap.get(row.user_id)
        return {
          id: row.id,
          role: row.role,
          full_name: u?.full_name ?? null,
          email: u?.email ?? null,
        }
      }),
    )

    const { data: taskRows } = await supabase.from('tasks').select('*').eq('team_id', teamId).order('created_at', { ascending: false })
    setTasks((taskRows || []) as TaskItem[])
    setLoading(false)
  }, [teamId])

  useEffect(() => {
    load()
  }, [load])

  async function inviteByEmail() {
    if (!teamId || !inviteEmail.trim()) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('team_invitations').insert({
      team_id: teamId,
      email: inviteEmail.trim(),
      role: 'member',
      inviter_id: user.id,
    })
    if (error) Alert.alert('Invite', error.message)
    else {
      setInviteEmail('')
      Alert.alert('Sent', 'Invitation recorded (email delivery depends on your backend).')
    }
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
      <ScreenHeader title={teamName || 'Team'} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        {canAdmin ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Invite by email</Text>
            <TextInput
              style={styles.input}
              placeholder="email@domain.com"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Pressable style={styles.btn} onPress={inviteByEmail}>
              <Text style={styles.btnText}>Add invitation</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.section}>Members</Text>
        {members.map(m => (
          <View key={m.id} style={styles.row}>
            <Text style={styles.name}>{m.full_name || m.email || 'Member'}</Text>
            <Text style={styles.role}>{m.role}</Text>
          </View>
        ))}

        <Text style={styles.section}>Tasks</Text>
        {tasks.map(t => (
          <Pressable key={t.id} style={styles.task} onPress={() => router.push(`/task/${t.id}` as Href)}>
            <Text style={styles.taskTitle}>{t.title}</Text>
            <Text style={styles.taskMeta}>{t.status}</Text>
          </Pressable>
        ))}
        {tasks.length === 0 ? <Text style={styles.empty}>No tasks in this team.</Text> : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  body: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: '900', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  btn: { backgroundColor: palette.primaryMid, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900' },
  section: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.muted,
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 8,
    backgroundColor: palette.surface,
  },
  name: { fontSize: 15, fontWeight: '700', color: palette.text },
  role: { fontSize: 12, color: palette.muted, fontWeight: '700', textTransform: 'capitalize' },
  task: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 8,
    backgroundColor: palette.surface,
  },
  taskTitle: { fontSize: 15, fontWeight: '800', color: palette.text },
  taskMeta: { fontSize: 12, color: palette.muted, marginTop: 4, fontWeight: '600' },
  empty: { color: palette.muted, fontWeight: '600' },
})
