import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { FadeIn } from '@/src/components/FadeIn'
import { UserAvatar } from '@/src/components/UserAvatar'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { ListSkeleton } from '@/src/components/Skeleton'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type MemberRow = {
  id: string
  role: string
  status: string | null
  user_id: string
  created_at?: string | null
  users?: { id: string; full_name: string | null; email: string | null; avatar_url?: string | null; created_at?: string | null } | null
}
type RoleFilter = 'all' | 'admin' | 'member'
type MemberTaskRow = { id: string; title: string; status: string; due_date: string | null; updated_at: string }

function fmtDate(iso?: string | null) {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Unknown'
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
}

function fmtShortDate(iso?: string | null) {
  if (!iso) return 'No due date'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'No due date'
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })
}

export function MembersTab({ projectId }: { projectId: string }) {
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [canAdmin, setCanAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({})
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null)
  const [memberTasks, setMemberTasks] = useState<MemberTaskRow[]>([])

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)
    const { data: project } = await supabase.from('projects').select('owner_id').eq('id', projectId).single()
    if (project) { setOwnerId((project as any).owner_id) }
    const memberWithCreated = await supabase.from('project_members').select('id, role, status, user_id, created_at').eq('project_id', projectId)
    const memberBasic = memberWithCreated.error
      ? await supabase.from('project_members').select('id, role, status, user_id').eq('project_id', projectId)
      : null
    const rows = (memberWithCreated.data || memberBasic?.data || []) as any[]
    const uids = (rows || []).map((r: any) => r.user_id).filter(Boolean)
    const usersExtended = await supabase.from('users').select('id, full_name, email, avatar_url, created_at').in('id', uids)
    const usersBasic = usersExtended.error
      ? await supabase.from('users').select('id, full_name, email').in('id', uids)
      : null
    const userRows = (usersExtended.data || usersBasic?.data || []) as any[]
    const umap = new Map((userRows || []).map((u: any) => [u.id, u]))
    const merged: MemberRow[] = (rows || []).map((r: any) => {
      const u = umap.get(r.user_id) || null
      return { ...r, created_at: r.created_at || u?.created_at || null, users: u }
    })
    setMembers(merged)

    // Team count per member (teams in this project)
    const { data: projectTeams } = await supabase.from('teams').select('id').eq('project_id', projectId)
    const projectTeamIds = (projectTeams || []).map((t: any) => t.id)
    if (projectTeamIds.length > 0 && uids.length > 0) {
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('team_id, user_id')
        .in('team_id', projectTeamIds)
        .in('user_id', uids)
      const teamCounter: Record<string, Set<string>> = {}
      for (const row of teamMembers || []) {
        const uid = (row as any).user_id
        const tid = (row as any).team_id
        if (!teamCounter[uid]) teamCounter[uid] = new Set()
        teamCounter[uid].add(tid)
      }
      const nextTeamCounts: Record<string, number> = {}
      for (const uid of uids) nextTeamCounts[uid] = teamCounter[uid]?.size || 0
      setTeamCounts(nextTeamCounts)
    } else {
      setTeamCounts({})
    }

    // Task count per member in this project
    if (uids.length > 0) {
      const { data: taskRows } = await supabase
        .from('tasks')
        .select('assigned_to')
        .eq('project_id', projectId)
        .in('assigned_to', uids)
      const nextTaskCounts: Record<string, number> = {}
      for (const uid of uids) nextTaskCounts[uid] = 0
      for (const row of taskRows || []) {
        const uid = (row as any).assigned_to
        if (uid) nextTaskCounts[uid] = (nextTaskCounts[uid] || 0) + 1
      }
      setTaskCounts(nextTaskCounts)
    } else {
      setTaskCounts({})
    }

    if (user) { const isOwner = project && (project as any).owner_id === user.id; const me = merged.find(m => m.user_id === user.id); setCanAdmin(!!isOwner || (me?.role === 'admin' && me?.status === 'accepted')) }
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const loadMemberTasks = async () => {
      if (!selectedMember) {
        setMemberTasks([])
        return
      }
      const { data } = await supabase
        .from('tasks')
        .select('id, title, status, due_date, updated_at')
        .eq('project_id', projectId)
        .eq('assigned_to', selectedMember.user_id)
        .order('updated_at', { ascending: false })
      setMemberTasks((data || []) as MemberTaskRow[])
    }
    loadMemberTasks()
  }, [projectId, selectedMember])

  async function respond(accept: boolean) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (accept) await supabase.from('project_members').update({ status: 'accepted' }).eq('project_id', projectId).eq('user_id', user.id)
    else await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', user.id)
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('related_id', projectId).eq('type', 'project_invite')
    load()
  }

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesRole = roleFilter === 'all' || m.role === roleFilter
      if (!matchesRole) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.trim().toLowerCase()
      const n = (m.users?.full_name || '').toLowerCase()
      const e = (m.users?.email || '').toLowerCase()
      return n.includes(q) || e.includes(q)
    })
  }, [members, roleFilter, searchQuery])
  const activeCount = useMemo(() => memberTasks.filter(t => t.status === 'in_progress').length, [memberTasks])
  const resolvedCount = useMemo(() => memberTasks.filter(t => t.status === 'completed').length, [memberTasks])
  const criticalCount = useMemo(
    () => memberTasks.filter(t => t.status !== 'completed' && !!t.due_date && new Date(t.due_date) < new Date()).length,
    [memberTasks],
  )

  if (loading) return <ListSkeleton />

  return (
    <FadeIn>
    <View style={s.root}>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={s.headTitle}>Personnel Hub</Text>
          <Text style={s.headSub}>Answer: who has access and roles?</Text>
        </View>
        {canAdmin ? (
          <Pressable style={s.invitePill} onPress={() => setInviteModalOpen(true)}>
            <Ionicons name="person-add-outline" size={16} color="#fff" />
            <Text style={s.invitePillText}>Invite Member</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={s.filtersWrap}>
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color={palette.muted} style={s.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or email..."
            placeholderTextColor={palette.muted}
            style={s.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={s.roleTabs}>
          {(['all', 'admin', 'member'] as const).map(role => (
            <Pressable key={role} onPress={() => setRoleFilter(role)} style={[s.tabBtn, roleFilter === role && s.tabBtnOn]}>
              <Text style={[s.tabText, roleFilter === role && s.tabTextOn]}>{role}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={s.tableCard}>
      {filteredMembers.map(m => {
        const name = m.users?.full_name || m.users?.email || 'Member'
        const pending = m.status === 'pending'
        const isSelf = currentUserId === m.user_id && pending
        return (
          <Pressable key={m.id} style={s.member} onPress={() => setSelectedMember(m)}>
            <View style={s.memberTop}>
              <UserAvatar uri={m.users?.avatar_url} name={name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{name}</Text>
                <Text style={s.email}>{m.users?.email || 'No email provided'}</Text>
              </View>
              <Pressable style={s.moreBtn}>
                <Ionicons name="ellipsis-horizontal" size={16} color={palette.muted} />
              </Pressable>
            </View>

            <View style={s.metaGrid}>
              <View style={s.metaPill}>
                <Ionicons name="shield-checkmark-outline" size={11} color={m.role === 'admin' ? palette.accent : palette.muted} />
                <Text style={[s.metaMini, m.role === 'admin' && { color: palette.accent }]}>{m.role}</Text>
              </View>
              <View style={s.metaPill}>
                <Ionicons name="people-outline" size={11} color={palette.muted} />
                <Text style={s.metaMini}>{teamCounts[m.user_id] || 0}</Text>
              </View>
              <View style={s.metaPill}>
                <Ionicons name="grid-outline" size={11} color={palette.muted} />
                <Text style={s.metaMini}>{taskCounts[m.user_id] || 0}</Text>
              </View>
              <View style={[s.statusBadge, m.status === 'accepted' ? s.statusOk : s.statusPending]}>
                <Text style={s.statusText}>{(m.status || 'unknown').toUpperCase()}</Text>
              </View>
            </View>
            {isSelf ? (
              <View style={s.respond}>
                <Pressable style={s.accept} onPress={(e) => { e.stopPropagation(); respond(true) }}><Text style={s.acceptT}>Accept</Text></Pressable>
                <Pressable style={s.reject} onPress={(e) => { e.stopPropagation(); respond(false) }}><Text style={s.rejectT}>Decline</Text></Pressable>
              </View>
            ) : null}
            {ownerId === m.user_id ? <Text style={s.ownerNote}>Owner</Text> : null}
          </Pressable>
        )
      })}
      {filteredMembers.length === 0 ? (
        <View style={s.emptyWrap}>
          <Ionicons name="people-outline" size={30} color="#cbd5e1" />
          <Text style={s.emptyText}>No personnel found</Text>
        </View>
      ) : null}
      </View>
      <InviteMemberModal visible={inviteModalOpen} onClose={() => setInviteModalOpen(false)} onCreated={load} />
      <Modal visible={!!selectedMember} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedMember(null)}>
        <View style={s.detailSheet}>
          <View style={s.detailHeader}>
            <Text style={s.detailHeaderTitle}>Personnel Profile</Text>
            <Pressable style={s.detailClose} onPress={() => setSelectedMember(null)}>
              <Ionicons name="close" size={20} color={palette.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.detailBody} showsVerticalScrollIndicator={false}>
            <View style={s.detailProfileWrap}>
              <View style={s.detailAvatar}>
                {selectedMember?.users?.avatar_url ? (
                  <Image source={{ uri: selectedMember.users.avatar_url }} style={s.detailAvatarImage} />
                ) : (
                  <Text style={s.detailAvatarFallback}>
                    {(selectedMember?.users?.full_name || selectedMember?.users?.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={s.detailName}>{selectedMember?.users?.full_name || 'Anonymous User'}</Text>
              <Text style={s.detailRole}>{selectedMember?.role || 'member'}</Text>
            </View>

            <View style={s.scoreGrid}>
              <View style={[s.scoreCard, s.scoreCardIndigo]}>
                <Text style={s.scoreLabel}>Active</Text>
                <Text style={[s.scoreValue, { color: '#4f46e5' }]}>{activeCount}</Text>
              </View>
              <View style={[s.scoreCard, s.scoreCardGreen]}>
                <Text style={[s.scoreLabel, { color: '#10b981' }]}>Resolved</Text>
                <Text style={[s.scoreValue, { color: '#10b981' }]}>{resolvedCount}</Text>
              </View>
              <View style={[s.scoreCard, s.scoreCardRed]}>
                <Text style={[s.scoreLabel, { color: '#ef4444' }]}>Critical</Text>
                <Text style={[s.scoreValue, { color: '#ef4444' }]}>{criticalCount}</Text>
              </View>
            </View>

            <View style={s.infoCard}>
              <View style={s.infoRow}>
                <View style={s.infoLeft}>
                  <Ionicons name="mail-outline" size={16} color={palette.muted} />
                  <Text style={s.infoValue}>{selectedMember?.users?.email || 'No email provided'}</Text>
                </View>
                <Text style={s.infoLabel}>Primary Email</Text>
              </View>
              <View style={s.infoRow}>
                <View style={s.infoLeft}>
                  <Ionicons name="calendar-outline" size={16} color={palette.muted} />
                  <Text style={s.infoValue}>{fmtDate(selectedMember?.created_at)}</Text>
                </View>
                <Text style={s.infoLabel}>Joined Workspace</Text>
              </View>
            </View>

            <View style={s.section}>
              <View style={s.sectionTitleRow}>
                <Ionicons name="bar-chart-outline" size={12} color={palette.accent} />
                <Text style={s.sectionTitle}>Project Progress</Text>
              </View>
              <View style={s.progressCard}>
                <View style={s.progressRow}>
                  <View>
                    <Text style={s.progressK}>Active Role</Text>
                    <Text style={s.progressV}>{selectedMember?.role || 'member'}</Text>
                  </View>
                  <View style={s.roleIconWrap}>
                    <Ionicons name="shield-outline" size={16} color={selectedMember?.role === 'admin' ? '#4f46e5' : palette.muted} />
                  </View>
                </View>
                <View style={s.progressRow}>
                  <View>
                    <Text style={s.progressK}>Status</Text>
                    <Text style={s.progressV}>{selectedMember?.status || 'unknown'}</Text>
                  </View>
                  <View style={[s.statusChip, selectedMember?.status === 'accepted' ? s.statusChipOk : s.statusChipPending]}>
                    <Text style={[s.statusChipText, selectedMember?.status === 'accepted' ? { color: '#16a34a' } : { color: '#b45309' }]}>
                      {(selectedMember?.status || 'unknown').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={s.section}>
              <View style={s.sectionTitleRow}>
                <Ionicons name="grid-outline" size={12} color={palette.accent} />
                <Text style={s.sectionTitle}>Task List</Text>
              </View>
              <View style={{ gap: 10 }}>
                {memberTasks.length > 0 ? memberTasks.map(task => (
                  <View key={task.id} style={s.taskCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.taskTitle} numberOfLines={1}>{task.title || 'Task'}</Text>
                      <View style={s.taskMetaRow}>
                        <Text style={[s.taskState, task.status === 'completed' ? { color: '#10b981' } : task.status === 'in_progress' ? { color: '#f59e0b' } : { color: '#94a3b8' }]}>
                          {task.status}
                        </Text>
                        <View style={s.taskDateWrap}>
                          <Ionicons name="time-outline" size={9} color={palette.muted} />
                          <Text style={s.taskDate}>{fmtShortDate(task.due_date)}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                  </View>
                )) : (
                  <View style={s.noTaskWrap}>
                    <Text style={s.noTaskText}>No assigned objectives</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
    </FadeIn>
  )
}

const s = StyleSheet.create({
  root: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  headTitle: { fontSize: 20, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: -0.3 },
  headSub: { marginTop: 4, fontSize: 10, color: palette.muted, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, fontStyle: 'italic' },
  invitePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.accent, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  invitePillText: { color: '#fff', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  filtersWrap: { gap: 10 },
  searchWrap: { position: 'relative', borderWidth: 1, borderColor: 'rgba(226,232,240,0.95)', backgroundColor: 'rgba(248,250,252,0.85)', borderRadius: 16 },
  searchIcon: { position: 'absolute', left: 12, top: '50%', marginTop: -8, zIndex: 1 },
  searchInput: { paddingLeft: 36, paddingRight: 12, paddingVertical: 12, fontSize: 11, fontWeight: '800', color: palette.text, letterSpacing: 0.5 },
  roleTabs: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(226,232,240,0.95)', backgroundColor: 'rgba(248,250,252,0.85)', borderRadius: 14, padding: 6, alignSelf: 'flex-end' },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  tabBtnOn: { backgroundColor: palette.accent },
  tabText: { fontSize: 10, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  tabTextOn: { color: '#fff' },
  tableCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)', backgroundColor: palette.surface, padding: 12, gap: 10 },
  member: { padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)', backgroundColor: palette.surface, gap: 10 },
  memberTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)' },
  avatarText: { fontSize: 14, fontWeight: '900', color: palette.accent },
  moreBtn: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  name: { fontSize: 16, fontWeight: '800', color: palette.text },
  email: { fontSize: 10, color: palette.muted, marginTop: 3, fontWeight: '600' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, backgroundColor: '#f8fafc' },
  metaMini: { fontSize: 9, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: 0.6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  statusOk: { backgroundColor: '#ecfdf5' },
  statusPending: { backgroundColor: '#fffbeb' },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.7, color: '#334155' },
  respond: { flexDirection: 'row', gap: 8 },
  accept: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  acceptT: { color: '#fff', fontWeight: '800', fontSize: 12 },
  reject: { borderWidth: 1, borderColor: palette.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  rejectT: { color: palette.text, fontWeight: '800', fontSize: 12 },
  ownerNote: { marginTop: -2, fontSize: 9, fontWeight: '900', color: palette.accent, textTransform: 'uppercase', letterSpacing: 0.7 },
  emptyWrap: { paddingVertical: 30, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 10, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.9 },
  detailSheet: { flex: 1, backgroundColor: palette.bg },
  detailHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailHeaderTitle: { fontSize: 16, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: 0.6 },
  detailClose: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  detailBody: { padding: 20, gap: 16, paddingBottom: 42 },
  detailProfileWrap: { alignItems: 'center', gap: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  detailAvatar: { width: 96, height: 96, borderRadius: 32, backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  detailAvatarImage: { width: '100%', height: '100%' },
  detailAvatarFallback: { fontSize: 30, fontWeight: '900', color: '#4f46e5' },
  detailName: { fontSize: 20, fontWeight: '900', color: palette.text, textTransform: 'uppercase' },
  detailRole: { fontSize: 10, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1, fontStyle: 'italic' },
  scoreGrid: { flexDirection: 'row', gap: 8 },
  scoreCard: { flex: 1, borderRadius: 20, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' },
  scoreCardIndigo: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  scoreCardGreen: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  scoreCardRed: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  scoreLabel: { fontSize: 8, fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  scoreValue: { fontSize: 20, fontWeight: '900' },
  infoCard: { gap: 10 },
  infoRow: { padding: 14, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#f8fafc', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  infoValue: { fontSize: 11, fontWeight: '700', color: '#64748b', flexShrink: 1 },
  infoLabel: { fontSize: 9, fontWeight: '900', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: 0.8 },
  section: { gap: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: 1 },
  progressCard: { borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 24, padding: 16, gap: 14, backgroundColor: '#fff' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressK: { fontSize: 11, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: 1 },
  progressV: { marginTop: 3, fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'capitalize', fontStyle: 'italic' },
  roleIconWrap: { padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#eef2ff' },
  statusChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  statusChipOk: { backgroundColor: '#dcfce7' },
  statusChipPending: { backgroundColor: '#fef3c7' },
  statusChipText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  taskCard: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  taskTitle: { fontSize: 11, fontWeight: '900', color: palette.text, textTransform: 'uppercase' },
  taskMetaRow: { marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskState: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.9 },
  taskDateWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  taskDate: { fontSize: 8, fontWeight: '800', color: palette.muted },
  noTaskWrap: { paddingVertical: 18, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', backgroundColor: '#f8fafc', alignItems: 'center' },
  noTaskText: { fontSize: 9, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1 },
})
