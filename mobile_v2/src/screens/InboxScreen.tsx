import { Ionicons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated'

import { FadeIn } from '@/src/components/FadeIn'
import { DrawerScreenHeader } from '@/src/components/ScreenHeader'
import { ListSkeleton } from '@/src/components/Skeleton'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { supabase } from '@/src/lib/supabase'
import { NotificationItem } from '@/src/types'
import { palette } from '@/src/theme'

type Filter = 'all' | 'assigned' | 'mention' | 'review' | 'system' | 'invite'

export default function InboxScreen() {
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setItems((data || []) as NotificationItem[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    let channel: any
    async function setup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      channel = supabase
        .channel('inbox-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => load())
        .subscribe()
    }
    setup()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [load])

  const filtered = items.filter(n => {
    if (unreadOnly && n.read) return false
    if (filter === 'all') return true
    if (filter === 'assigned') return n.type === 'assignment' || n.type === 'task_assignment'
    if (filter === 'mention') return n.type === 'mention'
    if (filter === 'review')
      return (
        n.type === 'review_required' ||
        (n.type === 'task_status_change' && String(n.message || '').toLowerCase().includes('review'))
      )
    if (filter === 'invite') return ['invite', 'workspace_invite', 'project_invite', 'team_invitation'].includes(n.type)
    if (filter === 'system')
      return (
        n.type === 'alert' ||
        (n.type === 'task_status_change' && !String(n.message || '').toLowerCase().includes('review'))
      )
    return true
  })

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setItems(prev => prev.map(x => (x.id === id ? { ...x, read: true } : x)))
  }

  const filterTabs: { id: Filter; label: string }[] = [
    { id: 'assigned', label: 'assigneds' },
    { id: 'mention', label: 'mentions' },
    { id: 'review', label: 'approvals' },
    { id: 'invite', label: 'invites' },
    { id: 'system', label: 'systems' },
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
                onRefresh={async () => {
                  setRefreshing(true)
                  await load()
                  setRefreshing(false)
                }}
                tintColor={palette.primary}
              />
            }
          >
            <View style={styles.shell}>
              {/* Header Area */}
              <View style={styles.headArea}>
                <View style={styles.headRow}>
                  <Text style={styles.headTitle}>INBOX</Text>
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
                        <Text style={[styles.tabText, active && styles.tabTextOn]}>{t.label}</Text>
                      </Pressable>
                    )
                  })}

                  <View style={styles.unreadWrap}>
                    <Text style={styles.unreadLabel}>Unread Only</Text>
                    <Pressable
                      onPress={() => setUnreadOnly(v => !v)}
                      style={[styles.toggle, unreadOnly && styles.toggleOn]}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: unreadOnly }}
                    >
                      <View style={[styles.knob, unreadOnly && styles.knobOn]} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.divider} />
              </View>

              {/* Content */}
              <View style={styles.listArea}>
                {filtered.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <View style={styles.emptyIconBox}>
                      <Ionicons name="notifications-outline" size={40} color="#e2e8f0" />
                    </View>
                    <Text style={styles.emptyKicker}>Inbox is empty</Text>
                  </View>
                ) : (
                  <View>
                    {filtered.map((n, idx) => (
                      <Animated.View key={n.id} entering={FadeInDown.delay(idx * 25)} layout={LinearTransition}>
                        <Pressable
                          style={[styles.item, !n.read && styles.itemUnread]}
                          onPress={() => markRead(n.id)}
                        >
                          <View style={styles.itemTop}>
                            <Text style={styles.itemTitle} numberOfLines={2}>
                              {n.message}
                            </Text>
                            <Text style={styles.itemTime}>
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </Text>
                          </View>
                          <Text style={styles.itemType}>{n.type.replace(/_/g, ' ')}</Text>
                        </Pressable>
                        {idx < filtered.length - 1 ? <View style={styles.itemDivider} /> : null}
                      </Animated.View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </FadeIn>
      )}

      <CreateTaskModal visible={taskModal} onClose={() => setTaskModal(false)} onCreated={load} onCreateProject={() => setProjectModal(true)} />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onCreated={load} />
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreated={load} onCreateProject={() => setProjectModal(true)} />
      <InviteMemberModal visible={memberModal} onClose={() => setMemberModal(false)} onCreated={load} onCreateProject={() => setProjectModal(true)} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  page: { paddingHorizontal: 12, paddingBottom: 28, paddingTop: 8 },
  shell: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  headArea: { padding: 18, paddingBottom: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headTitle: { fontSize: 24, fontWeight: '900', color: palette.text, letterSpacing: -0.5 },

  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 14 },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(148,163,184,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.28)',
  },
  tabBtnOn: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
    shadowColor: palette.accent,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  tabText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, color: '#94a3b8' },
  tabTextOn: { color: '#fff' },

  unreadWrap: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(148,163,184,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.28)',
  },
  unreadLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, color: '#94a3b8' },
  toggle: {
    width: 42,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },
  toggleOn: { backgroundColor: palette.accent },
  knob: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  knobOn: { left: 24 },

  divider: { height: 1, backgroundColor: 'rgba(148,163,184,0.15)' },
  listArea: { paddingHorizontal: 18, paddingBottom: 20 },

  emptyWrap: { paddingVertical: 90, alignItems: 'center' },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: 'rgba(148,163,184,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyKicker: { fontSize: 12, fontWeight: '900', letterSpacing: 2.2, textTransform: 'uppercase', color: '#94a3b8' },

  item: { paddingVertical: 18 },
  itemUnread: {},
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  itemTitle: { flex: 1, fontSize: 15, fontWeight: '900', color: palette.text, lineHeight: 20 },
  itemTime: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, paddingTop: 2 },
  itemType: { marginTop: 8, fontSize: 10, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.6 },
  itemDivider: { height: 1, backgroundColor: 'rgba(148,163,184,0.12)' },
})
