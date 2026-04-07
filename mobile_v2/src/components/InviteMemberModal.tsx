import { Ionicons } from '@expo/vector-icons'
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

import { SelectorModal } from './SelectorModal'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type Props = {
  visible: boolean
  onClose: () => void
  onCreated?: () => void
  onCreateProject?: () => void
}

const ROLES = ['admin', 'member', 'viewer'] as const

export function InviteMemberModal({ visible, onClose, onCreated, onCreateProject }: Props) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<(typeof ROLES)[number]>('member')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])

  const [projects, setProjects] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(true)

  // Selector state
  const [selVisible, setSelVisible] = useState(false)
  const [selTitle, setSelTitle] = useState('')
  const [selPlaceholder, setSelPlaceholder] = useState('')
  const [selAllowDefault, setSelAllowDefault] = useState(false)
  const [selOptions, setSelOptions] = useState<{ id: string; label: string }[]>([])
  const [selVal, setSelVal] = useState<string | null>(null)
  const [onSel, setOnSel] = useState<(v: string | null) => void>(() => {})

  const fetchInitialData = useCallback(async () => {
    setLoadingInitial(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch projects where user is admin/manager
    const { data: userProjects } = await supabase
      .from('project_members')
      .select('project:project_id(id, name)')
      .eq('user_id', user.id)
      .in('role', ['admin', 'manager'])

    const projectsList = (userProjects || []).map((p: any) => p.project).filter(Boolean)
    setProjects(projectsList)

    if (projectsList.length > 0) {
      setProjectId(projectsList[0].id)
    }
    setLoadingInitial(false)
  }, [])

  useEffect(() => {
    if (visible) {
      setEmail('')
      setRole('member')
      setProjectId(null)
      setSelectedTeamIds([])
      fetchInitialData()
    }
  }, [visible])

  // Fetch teams when project changes
  useEffect(() => {
    if (!projectId || !visible) {
      setTeams([])
      return
    }
    ;(async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, name')
        .eq('project_id', projectId)
      setTeams(data || [])
    })()
  }, [projectId, visible])

  const openSelector = (
    title: string,
    options: any[],
    value: string | null,
    setter: (v: any) => void,
    placeholder = '',
    allowDefault = false
  ) => {
    setSelTitle(title)
    setSelPlaceholder(placeholder)
    setSelAllowDefault(allowDefault)
    setSelOptions(options)
    setSelVal(value)
    setOnSel(() => setter)
    setSelVisible(true)
  }

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    )
  }

  async function submit() {
    if (!email.trim() || !projectId) {
      Alert.alert('Missing fields', 'Enter an email and select a project.')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setLoading(true)

    // Find the target user by email
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (!targetUser) {
      setLoading(false)
      Alert.alert('User not found', 'No account found with that email address.')
      return
    }

    // Add to project_members
    const { error: memberError } = await supabase.from('project_members').insert({
      project_id: projectId,
      user_id: targetUser.id,
      role,
      status: 'pending',
    })

    if (memberError) {
      setLoading(false)
      Alert.alert('Could not invite member', memberError.message)
      return
    }

    // Add to selected teams
    for (const teamId of selectedTeamIds) {
      await supabase.from('team_members').insert({
        team_id: teamId,
        user_id: targetUser.id,
        role: 'member',
      })
    }

    // Create notification for the invited user
    await supabase.from('notifications').insert({
      user_id: targetUser.id,
      type: 'project_invite',
      message: `You have been invited to join a project`,
      related_id: projectId,
    })

    setLoading(false)
    onClose()
    onCreated?.()
  }

  const noProjects = !loadingInitial && projects.length === 0

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Invite Member</Text>
            <Text style={styles.headerSub}>INVITE COLLABORATORS TO YOUR PROJECT</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {loadingInitial ? (
            <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />
          ) : noProjects ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={36} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No Projects Found</Text>
              <Text style={styles.emptyDesc}>
                Collaborators need a project to join. Create one first to start inviting.
              </Text>
              <Pressable
                style={styles.emptyAction}
                onPress={() => {
                  onClose()
                  onCreateProject?.()
                }}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyActionText}>Create My First Project</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Parent Project *</Text>
              <Pressable
                onPress={() => openSelector(
                  'Select Project',
                  projects.map(p => ({ id: p.id, label: p.name })),
                  projectId,
                  setProjectId,
                  'Select project...',
                  true
                )}
                style={styles.select}
              >
                <Text style={[styles.selectText, !projectId && { color: '#9ca3af' }]}>
                  {projects.find(p => p.id === projectId)?.name || 'Select Project...'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#94a3b8" />
              </Pressable>

              <Text style={styles.label}>Email *</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={[styles.input, email.length > 0 && styles.inputActive]}
                placeholder="name@company.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Role *</Text>
              <Pressable
                onPress={() => openSelector(
                  'Select Role',
                  ROLES.map(r => ({ id: r, label: r.charAt(0).toUpperCase() + r.slice(1) })),
                  role,
                  setRole as any
                )}
                style={styles.select}
              >
                <Text style={styles.selectText}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
                <Ionicons name="chevron-down" size={16} color="#94a3b8" />
              </Pressable>

              {teams.length > 0 && (
                <>
                  <Text style={styles.label}>Assign to Teams</Text>
                  <View style={styles.teamList}>
                    {teams.map(team => {
                      const isSelected = selectedTeamIds.includes(team.id)
                      return (
                        <Pressable
                          key={team.id}
                          style={[styles.teamItem, isSelected && styles.teamItemActive]}
                          onPress={() => toggleTeam(team.id)}
                        >
                          <View style={styles.teamAvatar}>
                            <Ionicons name="people" size={14} color="#94a3b8" />
                          </View>
                          <Text style={styles.teamName}>{team.name}</Text>
                          {isSelected && (
                            <View style={styles.checkMark}>
                              <Ionicons name="checkmark" size={10} color="#fff" />
                            </View>
                          )}
                        </Pressable>
                      )
                    })}
                  </View>
                </>
              )}

              <Pressable disabled={loading} onPress={submit} style={styles.cta}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>Send Invite</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
        <SelectorModal
          visible={selVisible}
          title={selTitle}
          placeholderLabel={selPlaceholder}
          allowDefaultSelect={selAllowDefault}
          options={selOptions}
          selectedValue={selVal}
          onSelect={onSel}
          onClose={() => setSelVisible(false)}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: palette.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    backgroundColor: palette.bg,
  },
  headerContent: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1e293b', letterSpacing: -1 },
  headerSub: { fontSize: 11, fontWeight: '900', color: '#94a3b8', marginTop: 8, letterSpacing: 1 },
  body: { paddingHorizontal: 24, paddingBottom: 60 },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 20,
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
    borderColor: '#6366f1',
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
  teamList: { gap: 6 },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  teamItemActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#e0e7ff',
  },
  teamAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#475569' },
  checkMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: -0.5, marginBottom: 8 },
  emptyDesc: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8, lineHeight: 18, marginBottom: 24 },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyActionText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  cta: {
    marginTop: 32,
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
