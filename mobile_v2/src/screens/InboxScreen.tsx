import { Ionicons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import { useMemo, useState } from 'react'
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { type Href, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated'

import { FadeIn } from '@/src/components/FadeIn'
import { DrawerScreenHeader } from '@/src/components/ScreenHeader'
import { ListSkeleton } from '@/src/components/Skeleton'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { useNotifications } from '@/src/context/NotificationContext'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type Filter = 'all' | 'assigned' | 'mention' | 'review' | 'system' | 'invite'

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  task_assignment: 'person-add-outline',
  task_status_change: 'swap-horizontal-outline',
  project_invite: 'mail-outline',
  invite: 'mail-outline',
  workspace_invite: 'mail-outline',
  team_invitation: 'people-outline',
  mention: 'at-outline',
  review_required: 'eye-outline',
  alert: 'alert-circle-outline',
}

const ICON_COLOR: Record<string, string> = {
  task_assignment: '#0077B6',
  task_status_change: '#6366f1',
  project_invite: '#f59e0b',
  invite: '#f59e0b',
  workspace_invite: '#f59e0b',
  team_invitation: '#10b981',
  mention: '#ec4899',
  review_required: '#8b5cf6',
  alert: '#ef4444',
}

export default function InboxScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { items, unreadCount, loading, reload, markRead, markAllRead, clearAll, deleteOne } = useNotifications()
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)

  const filtered = useMemo(() => items.filter(n => {
    if (unreadOnly && n.read) return false
    if (filter === 'all') return true
    if (filter === 'assigned') return n.type === 'assignment' || n.type === 'task_assignment'
    if (filter === 'mention') return n.type === 'mention'
    if (filter === 'review')
      return n.type === 'review_required' || (n.type === 'task_status_change' && (n.message || '').toLowerCase().includes('review'))
    if (filter === 'invite') return ['invite', 'workspace_invite', 'project_invite', 'team_invitation'].includes(n.type)
    if (filter === 'system')
      return n.type === 'alert' || (n.type === 'task_status_change' && !(n.message || '').toLowerCase().includes('review'))
    return true
  }), [items, filter, unreadOnly])

  function isInviteType(type: string) {
    return ['invite', 'workspace_invite', 'project_invite', 'team_invitation'].includes(type)
  }

  async function handleInvitation(notificationId: string, projectId: string | undefined, accept: boolean) {
    if (!projectId) return
    setProcessingId(notificationId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (accept) {
        const { error } = await supabase.from('project_members').update({ status: 'accepted' }).eq('project_id', projectId).eq('user_id', user.id)
        if (error) await supabase.from('project_members').upsert({ project_id: projectId, user_id: user.id, role: 'member', status: 'accepted' })
      } else {
        await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', user.id)
      }
      await markRead(notificationId)
      Alert.alert(accept ? 'Invitation Accepted' : 'Invitation Declined')
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setProcessingId(null)
    }
  }

  async function handlePress(n: typeof items[0]) {
    if (isInviteType(n.type)) return
    await markRead(n.id)
    if (n.related_id) router.push(`/task/${n.related_id}` as Href)
  }

  function handleClearAll() {
    Alert.alert('Clear All', 'Delete all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearAll },
    ])
  }

  const filterTabs: { id: Filter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'assigned', label: 'Assigned', icon: 'person-outline' },
    { id: 'review', label: 'Reviews', icon: 'eye-outline' },
    { id: 'invite', label: 'Invites', icon: 'mail-outline' },
    { id: 'system', label: 'System', icon: 'alert-circle-outline' },
  ]

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <DrawerScreenHeader
        onAddTask={() => setTaskModal(true)}
        onAddProject={() => setProjectModal(true)}
        onAddTeam={() => setTeamModal(true)}
        onAddMember={() => setMemberModal(true)}
      />
      {loading ? (
        <ListSkeleton />
      ) : (
        <FadeIn>
          <ScrollView
            contentContainerStyle={styles.page}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false) }}
                tintColor={palette.primary}
              />
            }
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headTitle}>Inbox</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadRow}>
                    <View style={styles.unreadPill}><Text style={styles.unreadPillText}>{unreadCount}</Text></View>
                    <Text style={styles.unreadLabel}>unread</Text>
                  </View>
                )}
              </View>
              <View style={styles.headerActions}>
                {unreadCount > 0 && (
                  <Pressable onPress={markAllRead} style={styles.hBtn}>
                    <Text style={styles.hBtnText}>Mark read</Text>
                  </Pressable>
                )}
                {items.length > 0 && (
                  <Pressable onPress={handleClearAll} style={[styles.hBtn, styles.clearBtn]}>
                    <Text style={styles.clearBtnText}>Clear all</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabsRow}>
              {filterTabs.map(t => {
                const active = filter === t.id
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setFilter(prev => (prev === t.id ? 'all' : t.id))}
                    style={[styles.tabBtn, active && styles.tabBtnOn]}
                  >
                    <Ionicons name={t.icon} size={12} color={active ? '#fff' : '#94a3b8'} />
                    <Text style={[styles.tabText, active && styles.tabTextOn]}>{t.label}</Text>
                  </Pressable>
                )
              })}
              <Pressable
                onPress={() => setUnreadOnly(v => !v)}
                style={[styles.tabBtn, unreadOnly && styles.tabBtnOn]}
              >
                <Ionicons name="radio-button-on-outline" size={12} color={unreadOnly ? '#fff' : '#94a3b8'} />
                <Text style={[styles.tabText, unreadOnly && styles.tabTextOn]}>Unread</Text>
              </Pressable>
            </View>

            {/* Content */}
            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="notifications-outline" size={40} color="#e2e8f0" />
                </View>
                <Text style={styles.emptyTitle}>All caught up</Text>
                <Text style={styles.emptyHint}>No notifications to show here.</Text>
              </View>
            ) : (
              filtered.map((n, idx) => {
                const iconName = ICON_MAP[n.type] || 'notifications-outline'
                const iconColor = ICON_COLOR[n.type] || palette.primary
                return (
                  <Animated.View key={n.id} entering={FadeInDown.delay(idx * 25).duration(300)} layout={LinearTransition}>
                    <Pressable style={[styles.card, !n.read && styles.cardUnread]} onPress={() => handlePress(n)}>
                      <View style={styles.cardTop}>
                        <View style={[styles.iconCircle, { backgroundColor: iconColor + '14' }]}>
                          <Ionicons name={iconName} size={18} color={iconColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.cardHeader}>
                            <Text style={styles.typePill}>{n.type.replace(/_/g, ' ')}</Text>
                            {!n.read && <View style={styles.unreadDot} />}
                          </View>
                          <Text style={[styles.message, !n.read && styles.messageBold]} numberOfLines={3}>{n.message}</Text>
                          <View style={styles.footer}>
                            <Ionicons name="time-outline" size={11} color={palette.muted} />
                            <Text style={styles.footerText}>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</Text>
                          </View>
                        </View>
                        <Pressable onPress={() => deleteOne(n.id)} hitSlop={8} style={styles.deleteBtn}>
                          <Ionicons name="close" size={14} color="#94a3b8" />
                        </Pressable>
                      </View>

                      {isInviteType(n.type) && !n.read && (
                        <View style={styles.inviteRow}>
                          <Pressable
                            style={styles.acceptBtn}
                            onPress={() => handleInvitation(n.id, n.related_id || undefined, true)}
                            disabled={!!processingId}
                          >
                            <Text style={styles.acceptText}>{processingId === n.id ? '...' : 'Accept'}</Text>
                          </Pressable>
                          <Pressable
                            style={styles.declineBtn}
                            onPress={() => handleInvitation(n.id, n.related_id || undefined, false)}
                            disabled={!!processingId}
                          >
                            <Text style={styles.declineText}>Decline</Text>
                          </Pressable>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                )
              })
            )}
          </ScrollView>
        </FadeIn>
      )}

      <CreateTaskModal visible={taskModal} onClose={() => setTaskModal(false)} onCreated={reload} onCreateProject={() => setProjectModal(true)} />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onCreated={reload} />
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreated={reload} onCreateProject={() => setProjectModal(true)} />
      <InviteMemberModal visible={memberModal} onClose={() => setMemberModal(false)} onCreated={reload} onCreateProject={() => setProjectModal(true)} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  page: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingHorizontal: 4 },
  headTitle: { fontSize: 28, fontWeight: '900', color: palette.text, letterSpacing: -0.5 },
  unreadRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  unreadPill: { backgroundColor: palette.accentSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  unreadPillText: { fontSize: 11, fontWeight: '900', color: palette.primary },
  unreadLabel: { fontSize: 11, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.5 },

  headerActions: { flexDirection: 'row', gap: 6, paddingTop: 4 },
  hBtn: { backgroundColor: palette.accentSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  hBtnText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: palette.primary, letterSpacing: 0.5 },
  clearBtn: { backgroundColor: '#fef2f2' },
  clearBtnText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: '#ef4444', letterSpacing: 0.5 },

  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18, paddingHorizontal: 4 },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(148,163,184,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  tabBtnOn: {
    backgroundColor: palette.primaryMid,
    borderColor: palette.primaryMid,
  },
  tabText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8' },
  tabTextOn: { color: '#fff' },

  emptyWrap: { paddingVertical: 80, alignItems: 'center' },
  emptyIconBox: {
    width: 96, height: 96, borderRadius: 32,
    backgroundColor: 'rgba(148,163,184,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: palette.text, marginBottom: 4 },
  emptyHint: { fontSize: 13, color: palette.muted, fontWeight: '600' },

  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardUnread: { borderColor: 'rgba(99,102,241,0.2)', backgroundColor: '#fdfdff' },
  cardTop: { flexDirection: 'row', gap: 12 },
  iconCircle: {
    width: 38, height: 38, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  typePill: { fontSize: 9, fontWeight: '900', color: palette.primary, textTransform: 'uppercase', letterSpacing: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary },
  message: { fontSize: 14, color: palette.muted, fontWeight: '600', lineHeight: 20 },
  messageBold: { color: palette.text, fontWeight: '800' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  footerText: { fontSize: 10, fontWeight: '700', color: palette.muted },
  deleteBtn: { padding: 4, marginTop: -2 },

  inviteRow: { flexDirection: 'row', gap: 10, marginTop: 14, marginLeft: 50 },
  acceptBtn: { flex: 1, backgroundColor: palette.primary, paddingVertical: 11, borderRadius: 14, alignItems: 'center', shadowColor: palette.primary, shadowOpacity: 0.2, shadowRadius: 8 },
  acceptText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  declineBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 11, borderRadius: 14, alignItems: 'center' },
  declineText: { color: palette.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
})
