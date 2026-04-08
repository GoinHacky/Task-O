import { Ionicons } from '@expo/vector-icons'
import { type Href, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { FadeIn } from '@/src/components/FadeIn'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { UserAvatar } from '@/src/components/UserAvatar'
import { ListSkeleton } from '@/src/components/Skeleton'
import { supabase } from '@/src/lib/supabase'
import { TaskItem } from '@/src/types'
import { palette } from '@/src/theme'

export default function ProjectTeamDetailScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id: projectId, teamId } = useLocalSearchParams<{ id: string; teamId: string }>()
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState<string | null>(null)
  const [teamLead, setTeamLead] = useState<string | null>(null)
  const [members, setMembers] = useState<
    { id: string; user_id: string; role: string; full_name: string | null; email: string | null; avatar_url?: string | null }[]
  >([])
  const [projectMembers, setProjectMembers] = useState<{ id: string; full_name: string | null; email: string | null; avatar_url?: string | null }[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [canAdmin, setCanAdmin] = useState(false)
  const [deployOpen, setDeployOpen] = useState(false)
  const [selectedDeployIds, setSelectedDeployIds] = useState<string[]>([])
  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)

  const load = useCallback(async () => {
    if (!teamId) {
      setLoading(false)
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: team } = await supabase
      .from('teams')
      .select('name, description, owner_id, project_id')
      .eq('id', teamId)
      .single()
    if (team) {
      const row = team as { name: string; description: string | null; owner_id: string | null; project_id: string | null }
      setTeamName(row.name)
      setTeamDescription(row.description)
      setTeamLead(row.owner_id)
    }

    const { data: tm } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user?.id || '')
      .maybeSingle()
    const isTeamOwner = !!user && (team as { owner_id?: string } | null)?.owner_id === user.id
    setCanAdmin(isTeamOwner || ['owner', 'admin'].includes((tm as { role: string } | null)?.role || ''))

    const { data: mem } = await supabase
      .from('team_members')
      .select('id, role, user_id')
      .eq('team_id', teamId)
    const ids = (mem || []).map(m => (m as { user_id: string }).user_id).filter(Boolean)
    const { data: users } = await supabase.from('users').select('id, full_name, email, avatar_url').in('id', ids)
    const umap = new Map(
      (users || []).map(
        u => [(u as { id: string }).id, u as { full_name: string | null; email: string | null; avatar_url?: string | null }]
      )
    )
    setMembers(
      (mem || []).map(m => {
        const row = m as { id: string; role: string; user_id: string }
        const u = umap.get(row.user_id)
        return {
          id: row.id,
          user_id: row.user_id,
          role: row.role,
          full_name: u?.full_name ?? null,
          email: u?.email ?? null,
          avatar_url: u?.avatar_url ?? null,
        }
      }),
    )

    const { data: taskRows } = await supabase.from('tasks').select('*').eq('team_id', teamId).order('created_at', { ascending: false })
    setTasks((taskRows || []) as TaskItem[])

    if (projectId) {
      const { data: projectMemberRows } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('status', 'accepted')
      const projectUserIds = (projectMemberRows || [])
        .map(p => (p as { user_id: string }).user_id)
        .filter(Boolean)
      if (projectUserIds.length > 0) {
        const { data: projectUsers } = await supabase
          .from('users')
          .select('id, full_name, email, avatar_url')
          .in('id', projectUserIds)
        setProjectMembers(
          (projectUsers || []) as { id: string; full_name: string | null; email: string | null; avatar_url?: string | null }[]
        )
      } else {
        setProjectMembers([])
      }
    } else {
      setProjectMembers([])
    }

    setLoading(false)
  }, [teamId, projectId])

  useEffect(() => {
    load()
  }, [load])

  async function deployPersonnel() {
    if (!teamId || selectedDeployIds.length === 0) return
    const inserts = selectedDeployIds.map(userId => ({
      team_id: teamId,
      user_id: userId,
      role: 'member',
    }))
    const { error } = await supabase.from('team_members').insert(inserts)
    if (error) {
      Alert.alert('Deployment failed', error.message)
      return
    }
    setDeployOpen(false)
    setSelectedDeployIds([])
    load()
  }

  const velocity = useMemo(() => {
    const done = tasks.filter(t => t.status === 'completed').length
    const active = tasks.filter(t => t.status === 'in_progress').length
    const risks = tasks.filter(t => t.status === 'review' || t.status === 'pending').length
    const total = tasks.length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0
    return { done, active, risks, progress }
  }, [tasks])

  const leadLabel = useMemo(() => {
    const lead = members.find(m => m.user_id === teamLead)
    return lead?.full_name || lead?.email || 'Not set'
  }, [members, teamLead])

  const availablePersonnel = useMemo(() => {
    const existing = new Set(members.map(m => m.user_id))
    return projectMembers.filter(p => !existing.has(p.id))
  }, [members, projectMembers])

  function toggleDeploy(id: string) {
    setSelectedDeployIds(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]))
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={teamName || 'Team'}
        onBack={() => router.back()}
        onAddTask={() => setTaskModal(true)}
        onAddProject={() => setProjectModal(true)}
        onAddTeam={() => setTeamModal(true)}
        onAddMember={() => setMemberModal(true)}
      />
      {loading ? (
        <ListSkeleton />
      ) : (
      <FadeIn>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.heroWrap}>
            <View style={styles.heroLeft}>
              <View style={styles.teamTitleRow}>
                <View style={styles.teamTitleIcon}>
                  <Ionicons name="people-outline" size={24} color={palette.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamTitle}>{teamName || 'Team'}</Text>
                  <View style={styles.heroMeta}>
                    <Text style={styles.metaText}>Lead: <Text style={styles.metaHighlight}>{leadLabel}</Text></Text>
                    <View style={styles.metaDot} />
                    <Text style={styles.metaText}>{members.length} Personnel Units</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.heroDescription} numberOfLines={3}>
                {(teamDescription || 'No description').toUpperCase()}
              </Text>
            </View>

            <View style={styles.velocityCard}>
              <View style={styles.velocityHead}>
                <Text style={styles.velocityLabel}>Workspace Velocity</Text>
                <View style={styles.velocityBadge}>
                  <Text style={styles.velocityBadgeText}>
                    {velocity.progress < 40 ? 'Observation Req' : velocity.progress < 70 ? 'On Pace' : 'Healthy'}
                  </Text>
                </View>
              </View>
              <View style={styles.velocityGrid}>
                <View style={styles.velocityItem}>
                  <Text style={[styles.velocityValue, { color: '#10b981' }]}>{velocity.done}</Text>
                  <Text style={styles.velocityItemLabel}>Done</Text>
                </View>
                <View style={styles.velocityItem}>
                  <Text style={[styles.velocityValue, { color: '#f59e0b' }]}>{velocity.active}</Text>
                  <Text style={styles.velocityItemLabel}>Active</Text>
                </View>
                <View style={styles.velocityItem}>
                  <Text style={[styles.velocityValue, { color: '#ef4444' }]}>{velocity.risks}</Text>
                  <Text style={styles.velocityItemLabel}>Risks</Text>
                </View>
              </View>
              <View style={styles.velocityTrack}>
                <View style={[styles.velocityFill, { width: `${velocity.progress}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.contentGrid}>
            <View style={styles.mainCol}>
              <View style={styles.panel}>
                <View style={styles.panelHead}>
                  <View style={styles.panelHeadLeft}>
                    <Ionicons name="pulse-outline" size={14} color={palette.accent} />
                    <Text style={styles.panelTitle}>Recent Tasks Manifest</Text>
                  </View>
                  <Text style={styles.panelMeta}>Execution Registry</Text>
                </View>

                {tasks.length === 0 ? (
                  <View style={styles.emptyPanel}>
                    <Text style={styles.emptyPanelText}>No Recent Operations Detected</Text>
                  </View>
                ) : (
                  <View style={styles.taskStack}>
                    {tasks.slice(0, 6).map(t => (
                      <Pressable
                        key={t.id}
                        style={styles.taskRow}
                        onPress={() => router.push(`/task/${t.id}` as Href)}
                      >
                        <View style={styles.taskRowLeft}>
                          <View style={styles.taskDot} />
                          <Text style={styles.taskTitle} numberOfLines={1}>{t.title}</Text>
                        </View>
                        <Text style={styles.taskStatus}>{String(t.status).replace('_', ' ')}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.sideCol}>
              <View style={styles.sideHead}>
                <Text style={styles.sideTitle}>Personnel</Text>
                {canAdmin ? (
                  <Pressable style={styles.sideIconBtn} onPress={() => setDeployOpen(true)}>
                    <Ionicons name="person-add-outline" size={17} color={palette.accent} />
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.personnelCard}>
                <View style={styles.personnelList}>
                  {members.map(m => (
                    <View key={m.id} style={styles.memberRow}>
                      <UserAvatar uri={m.avatar_url} name={m.full_name || m.email} size={36} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{m.full_name || m.email || 'Member'}</Text>
                        <Text style={styles.memberRole}>{m.role}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                {canAdmin ? (
                  <Pressable style={styles.deployBtn} onPress={() => setDeployOpen(true)}>
                    <Ionicons name="add" size={14} color={palette.accent} />
                    <Text style={styles.deployBtnText}>Deploy Personnel</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </ScrollView>
      </FadeIn>
      )}

      <Modal visible={deployOpen} animationType="fade" transparent onRequestClose={() => setDeployOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Unit Deployment</Text>
              <Pressable onPress={() => setDeployOpen(false)} style={styles.modalClose}>
                <Ionicons name="close" size={18} color={palette.muted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.modalSubTitle}>Available Personnel</Text>
              <Text style={styles.modalHint}>
                Assign existing project members to this specialized unit.
              </Text>

              {availablePersonnel.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>All project members assigned</Text>
                </View>
              ) : (
                <View style={styles.deployList}>
                  {availablePersonnel.map(p => {
                    const selected = selectedDeployIds.includes(p.id)
                    return (
                      <Pressable
                        key={p.id}
                        style={[styles.deployRow, selected && styles.deployRowOn]}
                        onPress={() => toggleDeploy(p.id)}
                      >
                        <UserAvatar uri={p.avatar_url} name={p.full_name || p.email} size={34} />
                        <Text style={styles.deployName}>{p.full_name || p.email || 'Member'}</Text>
                        {selected ? <Ionicons name="checkmark-circle" size={18} color={palette.accent} /> : null}
                      </Pressable>
                    )
                  })}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalGhostBtn} onPress={() => setDeployOpen(false)}>
                <Text style={styles.modalGhostText}>Return to Unit Dashboard</Text>
              </Pressable>
              {availablePersonnel.length > 0 ? (
                <Pressable
                  style={[styles.modalPrimaryBtn, selectedDeployIds.length === 0 && styles.modalPrimaryBtnDisabled]}
                  onPress={deployPersonnel}
                  disabled={selectedDeployIds.length === 0}
                >
                  <Text style={styles.modalPrimaryText}>Deploy Selected</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      <CreateTaskModal
        visible={taskModal}
        onClose={() => setTaskModal(false)}
        onCreated={load}
        onCreateProject={() => setProjectModal(true)}
      />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onCreated={load} />
      <CreateTeamModal
        visible={teamModal}
        onClose={() => setTeamModal(false)}
        onCreated={load}
        onCreateProject={() => setProjectModal(true)}
      />
      <InviteMemberModal
        visible={memberModal}
        onClose={() => setMemberModal(false)}
        onCreated={load}
        onCreateProject={() => setProjectModal(true)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  body: { padding: 16, paddingBottom: 56, gap: 14 },
  heroWrap: { gap: 12 },
  heroLeft: { gap: 10 },
  teamTitleRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  teamTitleIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: palette.text,
    letterSpacing: -0.6,
    textTransform: 'uppercase',
    lineHeight: 30,
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  metaText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  metaHighlight: { color: palette.text },
  metaDot: { width: 3, height: 3, borderRadius: 99, backgroundColor: '#d1d5db' },
  heroDescription: {
    fontSize: 11,
    color: palette.muted,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 16,
    opacity: 0.75,
  },
  velocityCard: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    padding: 18,
    gap: 14,
  },
  velocityHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  velocityLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  velocityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(251,191,36,0.18)',
  },
  velocityBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#b45309',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  velocityGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  velocityItem: { flex: 1, alignItems: 'center' },
  velocityValue: { fontSize: 22, fontWeight: '900' },
  velocityItemLabel: {
    fontSize: 8,
    marginTop: 5,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  velocityTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    overflow: 'hidden',
  },
  velocityFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  contentGrid: { gap: 14, marginTop: 4 },
  mainCol: { gap: 14 },
  sideCol: { gap: 8 },
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    backgroundColor: palette.surface,
    padding: 16,
    gap: 12,
  },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  panelTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    color: palette.accent,
  },
  panelMeta: {
    fontSize: 8,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontStyle: 'italic',
  },
  emptyPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(226,232,240,0.9)',
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyPanelText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  taskStack: { gap: 10 },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    backgroundColor: palette.surface,
  },
  taskRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 10 },
  taskDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: palette.accent },
  taskTitle: { fontSize: 12, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: 0.2 },
  taskStatus: { fontSize: 9, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.7 },
  sideHead: { paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideTitle: { fontSize: 16, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: -0.3 },
  sideIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  personnelCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    backgroundColor: palette.surface,
    padding: 16,
    gap: 12,
  },
  personnelList: { gap: 10 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 12, fontWeight: '900', color: palette.muted },
  memberName: { fontSize: 13, fontWeight: '900', color: palette.text },
  memberRole: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'capitalize',
  },
  deployBtn: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
    backgroundColor: 'rgba(99,102,241,0.05)',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deployBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.9)',
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  modalHead: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    color: palette.text,
  },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  modalBody: { padding: 16, paddingBottom: 18 },
  modalSubTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: palette.text,
  },
  modalHint: { marginTop: 6, fontSize: 10, color: palette.muted, fontStyle: 'italic' },
  modalEmpty: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(226,232,240,0.9)',
    paddingVertical: 26,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: palette.muted,
    fontStyle: 'italic',
  },
  deployList: { gap: 8, marginTop: 10 },
  deployRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    borderRadius: 14,
    padding: 10,
    backgroundColor: palette.surface,
  },
  deployRowOn: {
    borderColor: 'rgba(99,102,241,0.45)',
    backgroundColor: 'rgba(99,102,241,0.05)',
  },
  deployAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
  },
  deployAvatarText: { fontSize: 11, fontWeight: '900', color: palette.muted },
  deployName: { flex: 1, fontSize: 12, fontWeight: '800', color: palette.text },
  modalActions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.8)',
    padding: 12,
    gap: 8,
  },
  modalGhostBtn: {
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalGhostText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalPrimaryBtn: {
    borderRadius: 12,
    backgroundColor: palette.accent,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryBtnDisabled: { opacity: 0.45 },
  modalPrimaryText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
})
