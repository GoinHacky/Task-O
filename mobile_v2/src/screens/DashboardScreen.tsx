import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { type Href, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { StatCard } from '@/src/components/StatCard'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { supabase } from '@/src/lib/supabase'
import { NotificationItem, TaskItem, TeamMembership } from '@/src/types'
import { palette } from '@/src/theme'
import { useNavigation } from 'expo-router'
import { DrawerActions } from '@react-navigation/native'

function formatCount(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return String(count)
}

type PriorityTab = 'Pending' | 'Overdue' | 'Resolved'

export default function DashboardScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [announcements, setAnnouncements] = useState<NotificationItem[]>([])
  const [teams, setTeams] = useState<TeamMembership[]>([])
  const [fullName, setFullName] = useState('')
  const [projectCount, setProjectCount] = useState(0)
  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)
  const [prioTab, setPrioTab] = useState<PriorityTab>('Pending')

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const [{ data: taskRows }, { data: annRows }, { count: pc }, { data: profile }, { data: teamRows }] =
      await Promise.all([
        supabase
          .from('tasks')
          .select('*, projects:project_id ( id, name )')
          .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
          .order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('project_members').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('users').select('full_name').eq('id', user.id).single(),
        supabase
          .from('team_members')
          .select(
            `
          role,
          teams (
            id,
            name,
            avatar_url,
            project_id
          )
        `,
          )
          .eq('user_id', user.id)
          .limit(8),
      ])

    setTasks((taskRows || []) as TaskItem[])
    setAnnouncements((annRows || []) as NotificationItem[])
    setFullName(profile?.full_name || user.email?.split('@')[0] || 'there')
    setProjectCount(pc ?? 0)

    const tm = (teamRows || []) as unknown as TeamMembership[]
    setTeams(tm)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'completed').length
    const assigned = tasks.filter(t => t.assigned_to && t.status !== 'completed').length
    const scheduled = tasks.filter(t => t.due_date && new Date(t.due_date) > new Date() && t.status !== 'completed').length
    const pendingCount = tasks.filter(
      t => t.status !== 'completed' && t.due_date && new Date(t.due_date) >= new Date(),
    ).length
    const overdueCount = tasks.filter(
      t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed',
    ).length
    return { completed, assigned, scheduled, pendingCount, overdueCount }
  }, [tasks])

  const filteredPrio = useMemo(() => {
    return tasks
      .filter(task => {
        if (prioTab === 'Resolved') return task.status === 'completed'
        if (prioTab === 'Overdue')
          return !!(task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed')
        return (
          task.status !== 'completed' &&
          !!task.due_date &&
          new Date(task.due_date) >= new Date()
        )
      })
      .sort((a, b) => {
        if (prioTab === 'Pending' && a.due_date && b.due_date)
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      .slice(0, 10)
  }, [tasks, prioTab])

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    )
  }

  const tabs: { label: PriorityTab; count: number; color: string; hover: string }[] = [
    { label: 'Pending', count: stats.pendingCount, color: palette.pending, hover: '#DA8C45' },
    { label: 'Overdue', count: stats.overdueCount, color: palette.overdue, hover: '#D64543' },
    { label: 'Resolved', count: stats.completed, color: palette.resolved, hover: '#26B889' },
  ]

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader 
        onMenu={() => navigation.dispatch(DrawerActions.openDrawer())} 
        onNotification={() => router.push('/notifications')}
        onAddTask={() => setTaskModal(true)}
        onAddProject={() => setProjectModal(true)}
        onAddTeam={() => setTeamModal(true)}
        onAddMember={() => setMemberModal(true)}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={palette.primary} />}
      >
        {/* Stats Grid - Cleaner layout */}
        <View style={styles.statRow}>
          <Pressable style={{ flex: 1 }} onPress={() => router.push('/tasks' as Href)}>
            <StatCard label="Completed Tasks" value={formatCount(stats.completed)} color="#0096C7" icon={<Ionicons name="checkmark-done" size={24} color="#0096C7" />} />
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => router.push('/tasks' as Href)}>
            <StatCard label="Assigned Tasks" value={formatCount(stats.assigned)} color="#0077B6" icon={<Ionicons name="person" size={24} color="#0077B6" />} />
          </Pressable>
        </View>
        <View style={styles.statRow}>
          <Pressable style={{ flex: 1 }} onPress={() => router.push('/projects' as Href)}>
            <StatCard label="Active Boards" value={formatCount(projectCount)} color="#023E8A" icon={<Ionicons name="grid" size={24} color="#023E8A" />} />
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => router.push('/calendar' as Href)}>
            <StatCard label="Scheduled Tasks" value={formatCount(stats.scheduled)} color="#03045E" icon={<Ionicons name="calendar" size={24} color="#03045E" />} />
          </Pressable>
        </View>

        {/* Priority Tabs - WEB STYLE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionTitle}>Objective Priorities</Text>
              <Text style={styles.sectionHint}>Collective objectives sorted by priority</Text>
            </View>
          </View>

          <View style={styles.tabGrid}>
            {tabs.map((t) => {
              const isActive = prioTab === t.label
              return (
                <Pressable
                  key={t.label}
                  onPress={() => setPrioTab(t.label)}
                  style={[
                    styles.prioTabBtn,
                    { backgroundColor: t.color, borderColor: isActive ? 'rgba(0,0,0,0.2)' : 'transparent' },
                    isActive && styles.prioTabActive
                  ]}
                >
                  <Text style={styles.prioTabText}>{t.label}</Text>
                  <View style={styles.prioBadge}>
                    <Text style={styles.prioBadgeText}>{t.count}</Text>
                  </View>
                </Pressable>
              )
            })}
          </View>

          <View style={{ minHeight: 200, marginTop: 8 }}>
            {filteredPrio.length === 0 ? (
              <Animated.View entering={FadeInDown} style={styles.emptyTasks}>
                <Ionicons name="layers-outline" size={32} color="#cbd5e1" />
                <Text style={styles.emptyTasksText}>No tasks found for this section</Text>
              </Animated.View>
            ) : (
              filteredPrio.map((task, index) => (
                <Animated.View 
                  key={task.id} 
                  entering={FadeInDown.delay(index * 50)} 
                  layout={LinearTransition}
                >
                  <Pressable
                    style={styles.taskListItem}
                    onPress={() => router.push(`/task/${task.id}` as Href)}
                  >
                    <View style={styles.taskIndicator}>
                      <View style={styles.taskDot} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskItemTitle} numberOfLines={1}>{task.title}</Text>
                      <View style={styles.taskMetaRow}>
                        <View style={styles.metaBadge}>
                          <Ionicons name="calendar-outline" size={12} color={palette.muted} />
                          <Text style={styles.metaBadgeText}>
                            {task.due_date ? format(new Date(task.due_date), 'dd MMM yyyy') : 'No due date'}
                          </Text>
                        </View>
                        {task.priority && (
                          <View style={[
                            styles.prioPill,
                            task.priority === 'high' ? styles.prioHigh : task.priority === 'medium' ? styles.prioMed : styles.prioLow
                          ]}>
                            <Ionicons name="alert-circle-outline" size={11} color="currentColor" />
                            <Text style={styles.prioPillText}>{task.priority}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))
            )}
          </View>
        </View>

        {/* Announcements - Premium List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          <Text style={styles.sectionHint}>System briefs and project updates</Text>
          {announcements.length === 0 ? (
            <View style={styles.emptySub}>
              <Ionicons name="megaphone-outline" size={28} color="#e2e8f0" />
              <Text style={styles.emptySubText}>No updates available.</Text>
            </View>
          ) : (
            announcements.map(ann => (
              <View key={ann.id} style={styles.announcementRow}>
                <View style={styles.annCircle}>
                  <Ionicons name={ann.type === 'team_invitation' ? 'people' : 'notifications'} size={14} color={palette.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.annMessage}>{ann.message}</Text>
                  <Text style={styles.annTime}>{format(new Date(ann.created_at), 'dd MMM yyyy • p')}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Teams - Clean Grid */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Teams</Text>
          <Text style={styles.sectionHint}>Teams you belong to</Text>
          <View style={styles.teamGrid}>
            {teams.filter(m => m.teams).length === 0 ? (
              <View style={styles.emptySub}>
                <Ionicons name="people-outline" size={32} color="#e2e8f0" />
                <Text style={styles.emptySubText}>Join a team to collaborate.</Text>
              </View>
            ) : (
              teams.filter(m => m.teams).map(m => {
                const team = m.teams!
                return (
                  <Pressable key={team.id} style={styles.teamBox} onPress={() => team.project_id && router.push(`/project/${team.project_id}` as Href)}>
                    <View style={styles.teamLetterBox}>
                      <Text style={styles.teamLetter}>{team.name?.[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.teamBoxName} numberOfLines={1}>{team.name}</Text>
                    <View style={styles.roleChip}>
                      <Text style={styles.roleChipText}>{m.role}</Text>
                    </View>
                  </Pressable>
                )
              })
            )}
          </View>
        </View>
      </ScrollView>

      <CreateTaskModal visible={taskModal} onClose={() => setTaskModal(false)} onCreated={load} onCreateProject={() => setProjectModal(true)} />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onCreated={load} />
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreated={load} onCreateProject={() => setProjectModal(true)} />
      <InviteMemberModal visible={memberModal} onClose={() => setMemberModal(false)} onCreated={load} onCreateProject={() => setProjectModal(true)} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  greetingHeader: { fontSize: 10, fontWeight: '900', color: palette.primary, textTransform: 'uppercase', letterSpacing: 2.5 },
  heroName: { fontSize: 30, fontWeight: '900', color: palette.text, marginTop: 4, letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: palette.muted, marginTop: 2, marginBottom: 20, fontWeight: '600' },

  quickActions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickActionBtn: {
    flex: 1,
    backgroundColor: palette.surface,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  quickActionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickActionLabel: { fontSize: 9, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.5 },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  
  sectionCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.1)',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 1,
  },
  sectionHead: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: palette.text, letterSpacing: -0.5 },
  sectionHint: { fontSize: 12, color: palette.muted, marginTop: 4, fontWeight: '600' },

  tabGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  prioTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  prioTabActive: { transform: [{ translateY: -1 }], shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  prioTabText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  prioBadge: { backgroundColor: 'rgba(255,255,255,0.2)', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  prioBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },

  taskIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: palette.primary,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.primary },
  taskListItem: { flexDirection: 'row', gap: 14, marginBottom: 20, alignItems: 'flex-start' },
  taskItemTitle: { fontSize: 16, fontWeight: '900', color: palette.text, letterSpacing: -0.2 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  metaBadgeText: { fontSize: 11, fontWeight: '800', color: palette.muted },
  
  prioPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  prioPillText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  prioHigh: { backgroundColor: '#fef2f2', color: '#dc2626' },
  prioMed: { backgroundColor: '#fffbeb', color: '#d97706' },
  prioLow: { backgroundColor: '#f0fdf4', color: '#16a34a' },

  emptyTasks: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTasksText: { fontSize: 13, color: palette.muted, fontWeight: '600', fontStyle: 'italic' },

  announcementRow: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  annCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  annMessage: { fontSize: 14, fontWeight: '700', color: palette.text, lineHeight: 20 },
  annTime: { fontSize: 11, color: palette.muted, marginTop: 4, fontWeight: '600' },

  teamGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  teamBox: { width: '48%', backgroundColor: palette.surface, borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(148,163,184,0.1)' },
  teamLetterBox: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: palette.border },
  teamLetter: { fontSize: 24, fontWeight: '900', color: palette.primary },
  teamBoxName: { fontSize: 14, fontWeight: '900', color: palette.text, textAlign: 'center' },
  roleChip: { marginTop: 6, backgroundColor: palette.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleChipText: { fontSize: 9, fontWeight: '900', color: palette.primary, textTransform: 'uppercase' },

  emptySub: { width: '100%', alignItems: 'center', paddingVertical: 30, gap: 6 },
  emptySubText: { fontSize: 13, color: '#cbd5e1', fontWeight: '700' },
})
