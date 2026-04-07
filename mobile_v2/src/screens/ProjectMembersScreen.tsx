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

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type MemberRow = {
  id: string
  role: string
  status: string | null
  user_id: string
  users?: { id: string; full_name: string | null; email: string | null } | null
}

export default function ProjectMembersScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id: projectId } = useLocalSearchParams<{ id: string }>()
  const [projectName, setProjectName] = useState('')
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member'>('member')
  const [canAdmin, setCanAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    const { data: project } = await supabase.from('projects').select('name, owner_id').eq('id', projectId).single()
    if (project) {
      setProjectName((project as { name: string }).name)
      setOwnerId((project as { owner_id: string }).owner_id)
    }

    const { data: rows } = await supabase
      .from('project_members')
      .select('id, role, status, user_id')
      .eq('project_id', projectId)

    const uids = (rows || []).map(r => (r as { user_id: string }).user_id).filter(Boolean)
    const { data: userRows } = await supabase.from('users').select('id, full_name, email').in('id', uids)
    const umap = new Map((userRows || []).map(u => [(u as { id: string }).id, u as { id: string; full_name: string | null; email: string | null }]))

    const merged: MemberRow[] = (rows || []).map(r => {
      const row = r as { id: string; role: string; status: string | null; user_id: string }
      const u = umap.get(row.user_id)
      return {
        id: row.id,
        role: row.role,
        status: row.status,
        user_id: row.user_id,
        users: u ? { id: u.id, full_name: u.full_name, email: u.email } : null,
      }
    })
    setMembers(merged)

    if (user) {
      const isOwner = project && (project as { owner_id: string }).owner_id === user.id
      const me = merged.find(m => m.user_id === user.id)
      const admin = isOwner || (me?.role === 'admin' && me?.status === 'accepted')
      setCanAdmin(!!admin)
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  async function sendInvite() {
    if (!projectId || !inviteEmail.trim()) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: target } = await supabase.from('users').select('id').eq('email', inviteEmail.trim()).maybeSingle()
    if (!target) {
      Alert.alert('Not found', 'No user with that email. They must register first.')
      return
    }

    const { data: existing } = await supabase
      .from('project_members')
      .select('status')
      .eq('project_id', projectId)
      .eq('user_id', (target as { id: string }).id)
      .maybeSingle()

    if (existing) {
      Alert.alert('Already invited', 'This user is already on the project.')
      return
    }

    const { error } = await supabase.from('project_members').insert({
      project_id: projectId,
      user_id: (target as { id: string }).id,
      role: inviteRole,
      status: 'pending',
    })
    if (error) {
      Alert.alert('Invite failed', error.message)
      return
    }

    const { data: inviter } = await supabase.from('users').select('full_name').eq('id', user.id).single()
    await supabase.from('notifications').insert({
      user_id: (target as { id: string }).id,
      type: 'project_invite',
      message: `You've been invited to join "${projectName}" by ${(inviter as { full_name: string } | null)?.full_name || 'a teammate'}`,
      related_id: projectId,
      read: false,
      metadata: { project_name: projectName },
    })
    setInviteEmail('')
    Alert.alert('Sent', 'Invitation delivered.')
    load()
  }

  async function respond(projectIdLocal: string, accept: boolean) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    if (accept) {
      await supabase.from('project_members').update({ status: 'accepted' }).eq('project_id', projectIdLocal).eq('user_id', user.id)
    } else {
      await supabase.from('project_members').delete().eq('project_id', projectIdLocal).eq('user_id', user.id)
    }
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('related_id', projectIdLocal)
      .eq('type', 'project_invite')
    load()
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
      <ScreenHeader title="Members" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        {canAdmin ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Invite by email</Text>
            <TextInput
              style={styles.input}
              placeholder="colleague@company.com"
              placeholderTextColor="#94a3b8"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.row}>
              {(['member', 'manager', 'admin'] as const).map(r => (
                <Pressable key={r} onPress={() => setInviteRole(r)} style={[styles.chip, inviteRole === r && styles.chipOn]}>
                  <Text style={[styles.chipText, inviteRole === r && styles.chipTextOn]}>{r}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.inviteBtn} onPress={sendInvite}>
              <Text style={styles.inviteBtnText}>Send invite</Text>
            </Pressable>
          </View>
        ) : null}

        {members.map(m => {
          const name = m.users?.full_name || m.users?.email || 'Member'
          const pending = m.status === 'pending'
          const isSelf = currentUserId === m.user_id && pending
          return (
            <View key={m.id} style={styles.member}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.meta}>
                  {m.role} · {m.status || '—'}
                  {ownerId === m.user_id ? ' · owner' : ''}
                </Text>
              </View>
              {isSelf ? (
                <View style={styles.respond}>
                  <Pressable style={styles.accept} onPress={() => projectId && respond(projectId, true)}>
                    <Text style={styles.acceptT}>Accept</Text>
                  </Pressable>
                  <Pressable style={styles.reject} onPress={() => projectId && respond(projectId, false)}>
                    <Text style={styles.rejectT}>Decline</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )
        })}
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
  cardTitle: { fontSize: 14, fontWeight: '900', color: palette.text, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: palette.text,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.bg,
  },
  chipOn: { borderColor: palette.accent, backgroundColor: palette.accentSoft },
  chipText: { fontSize: 12, fontWeight: '700', color: palette.muted, textTransform: 'capitalize' },
  chipTextOn: { color: palette.primaryMid },
  inviteBtn: {
    backgroundColor: palette.primaryMid,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  inviteBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: '800', color: palette.text },
  meta: { fontSize: 12, color: palette.muted, marginTop: 4, fontWeight: '600' },
  respond: { flexDirection: 'row', gap: 8 },
  accept: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  acceptT: { color: '#fff', fontWeight: '800', fontSize: 12 },
  reject: {
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rejectT: { color: palette.text, fontWeight: '800', fontSize: 12 },
})
