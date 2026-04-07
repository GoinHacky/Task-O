import { Ionicons } from '@expo/vector-icons'
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

import { SelectorModal } from './SelectorModal'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type Props = {
  visible: boolean
  onClose: () => void
  onCreated?: () => void
  onCreateProject?: () => void
}

export function CreateTeamModal({ visible, onClose, onCreated, onCreateProject }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [leadId, setLeadId] = useState<string | null>(null)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])

  const [projects, setProjects] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
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

    // Fetch projects where user is admin or manager
    const { data: userProjects } = await supabase
      .from('project_members')
      .select('project:project_id(id, name)')
      .eq('user_id', user.id)
      .in('role', ['admin', 'manager'])

    const projectsList = (userProjects || []).map((p: any) => p.project).filter(Boolean)
    setProjects(projectsList)

    if (projectsList.length > 0 && !projectId) {
      setProjectId(projectsList[0].id)
    }
    setLoadingInitial(false)
  }, [])

  useEffect(() => {
    if (visible) {
      setName('')
      setDescription('')
      setProjectId(null)
      setLeadId(null)
      setSelectedMemberIds([])
      fetchInitialData()
    }
  }, [visible])

  // Fetch project members when project changes
  useEffect(() => {
    if (!projectId || !visible) {
      setMembers([])
      return
    }
    ;(async () => {
      const { data } = await supabase
        .from('project_members')
        .select('user:user_id(id, full_name, email)')
        .eq('project_id', projectId)
        .eq('status', 'accepted')

      const memberList = (data || []).map((m: any) => m.user).filter(Boolean)
      setMembers(memberList)
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

  const toggleMember = (userId: string) => {
    if (userId === leadId) return
    setSelectedMemberIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  async function submit() {
    if (!name.trim() || !projectId) {
      Alert.alert('Missing fields', 'Enter a team name and select a project.')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setLoading(true)

    // Create the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        project_id: projectId,
        owner_id: user.id,
      })
      .select('id')
      .single()

    if (teamError || !team) {
      setLoading(false)
      Alert.alert('Could not create team', teamError?.message || 'Unknown error')
      return
    }

    // Add lead as member if selected
    if (leadId && leadId !== user.id) {
      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: leadId,
        role: 'admin',
      })
    }

    // Add selected members
    const memberInserts = selectedMemberIds
      .filter(id => id !== user.id && id !== leadId)
      .map(id => ({ team_id: team.id, user_id: id, role: 'member' }))

    if (memberInserts.length > 0) {
      await supabase.from('team_members').insert(memberInserts)
    }

    setLoading(false)
    onClose()
    onCreated?.()
  }

  const noProjects = !loadingInitial && projects.length === 0

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Create Team</Text>
            <Text style={styles.headerSub}>GROUP MEMBERS BY FUNCTION</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {loadingInitial ? (
            <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />
          ) : noProjects ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="grid-outline" size={36} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No Projects Found</Text>
              <Text style={styles.emptyDesc}>
                You need a project to house your team. Create one first to get started.
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
              <Text style={styles.label}>Team Name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={[styles.input, name.length > 0 && styles.inputActive]}
                placeholder="e.g. Design Engine"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Parent Project *</Text>
              <Pressable
                onPress={() => openSelector(
                  'Select Project',
                  projects.map(p => ({ id: p.id, label: p.name })),
                  projectId,
                  setProjectId
                )}
                style={styles.select}
              >
                <Text style={[styles.selectText, !projectId && { color: '#9ca3af' }]}>
                  {projects.find(p => p.id === projectId)?.name || 'Select Project...'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#94a3b8" />
              </Pressable>

              <Text style={styles.label}>Team Lead</Text>
              <Pressable
                onPress={() => openSelector(
                  'Select Team Lead',
                  members.map(m => ({ id: m.id, label: m.full_name || m.email })),
                  leadId,
                  setLeadId,
                  'Select a member...',
                  true
                )}
                style={styles.select}
              >
                <Text style={[styles.selectText, !leadId && { color: '#9ca3af' }]}>
                  {members.find(m => m.id === leadId)?.full_name || 'Select a member...'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#94a3b8" />
              </Pressable>

              {members.filter(m => m.id !== leadId).length > 0 && (
                <>
                  <Text style={styles.label}>Members</Text>
                  <View style={styles.memberList}>
                    {members.filter(m => m.id !== leadId).map(member => {
                      const isSelected = selectedMemberIds.includes(member.id)
                      return (
                        <Pressable
                          key={member.id}
                          style={[styles.memberItem, isSelected && styles.memberItemActive]}
                          onPress={() => toggleMember(member.id)}
                        >
                          <View style={styles.memberAvatar}>
                            <Ionicons name="person" size={14} color="#94a3b8" />
                          </View>
                          <Text style={styles.memberName}>{member.full_name || member.email}</Text>
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

              <Text style={styles.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.multiline]}
                placeholder="Core mission and responsibilities..."
                placeholderTextColor="#9ca3af"
                multiline
              />

              <Pressable disabled={loading} onPress={submit} style={styles.cta}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>Create Team</Text>
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
      </KeyboardAvoidingView>
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
  multiline: { height: 100, textAlignVertical: 'top', marginTop: 4 },
  memberList: { gap: 6 },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  memberItemActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#e0e7ff',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#475569' },
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
