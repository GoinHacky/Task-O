import { Ionicons } from '@expo/vector-icons'
import { format, formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { type Href, useRouter, useNavigation } from 'expo-router'
import { DrawerActions } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { supabase } from '@/src/lib/supabase'
import { NotificationItem } from '@/src/types'
import { palette } from '@/src/theme'

type Filter = 'all' | 'assigned' | 'mention' | 'review' | 'system' | 'invite'

export default function InboxScreen() {
  const router = useRouter()
  const navigation = useNavigation()
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
    if (filter === 'review') return n.type === 'review_required'
    if (filter === 'invite') return ['invite', 'workspace_invite', 'project_invite', 'team_invitation'].includes(n.type)
    return true
  })

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setItems(prev => prev.map(x => (x.id === id ? { ...x, read: true } : x)))
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
    load()
  }

  async function clearAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    Alert.alert('Clear Inbox', 'Delete all items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: async () => {
          await supabase.from('notifications').delete().eq('user_id', user.id)
          setItems([])
        }
      },
    ])
  }

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={palette.primary} /></View>
  }

  const filters: Filter[] = ['all', 'assigned', 'mention', 'review', 'invite']
  const unreadCount = items.filter(n => !n.read).length

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        onMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
        onNotification={() => {}} // Already on Inbox, maybe just refresh
        onAddTask={() => setTaskModal(true)}
        onAddProject={() => setProjectModal(true)}
        onAddTeam={() => setTeamModal(true)}
        onAddMember={() => setMemberModal(true)}
        right={
          <View style={styles.headerActions}>
            <Pressable onPress={markAllRead} style={styles.hBtn}>
              <Ionicons name="checkmark-done" size={18} color={palette.primary} />
            </Pressable>
          </View>
        }
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {filters.map(f => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.fChip, filter === f && styles.fChipOn]}>
            <Text style={[styles.fChipText, filter === f && styles.fChipTextOn]}>{f}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setUnreadOnly(!unreadOnly)} style={[styles.fChip, unreadOnly && styles.fChipOn]}>
          <Text style={[styles.fChipText, unreadOnly && styles.fChipTextOn]}>Unread</Text>
        </Pressable>
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={palette.primary} />}>

        {filtered.length === 0 ? (
          <View style={styles.empty}><Ionicons name="mail-open-outline" size={36} color="#e2e8f0" /><Text style={styles.emptyText}>No matching messages.</Text></View>
        ) : (
          filtered.map((n, idx) => (
            <Animated.View key={n.id} entering={FadeInDown.delay(idx * 30)} layout={LinearTransition}>
              <Pressable style={[styles.card, !n.read && styles.cardUnread]} onPress={() => !['invite'].includes(n.type) && markRead(n.id)}>
                <Text style={styles.typeTag}>{n.type.replace(/_/g, ' ')}</Text>
                <Text style={[styles.msgText, !n.read && styles.msgTextBold]}>{n.message}</Text>
                <View style={styles.footer}>
                  <Ionicons name="time-outline" size={12} color={palette.muted} />
                  <Text style={styles.footerDate}>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</Text>
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}
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
  filterScroll: { maxHeight: 52, flexGrow: 0, marginTop: 8 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  fChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: palette.surface, borderWidth: 1, borderColor: 'rgba(148,163,184,0.1)' },
  fChipOn: { backgroundColor: palette.primary, borderColor: palette.primary },
  fChipText: { fontSize: 9, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  fChipTextOn: { color: '#fff' },

  content: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 10 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: palette.text, letterSpacing: -1 },
  unreadBadge: { alignSelf: 'flex-start', backgroundColor: palette.primary, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  unreadBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  headerActions: { flexDirection: 'row', gap: 6 },
  hBtn: { backgroundColor: palette.accentSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  hBtnText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: palette.primary, letterSpacing: 0.5 },
  clearBtn: { backgroundColor: '#fef2f2' },
  clearBtnText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: '#ef4444', letterSpacing: 0.5 },

  card: { backgroundColor: palette.surface, borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(148,163,184,0.1)', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 1 },
  cardUnread: { borderColor: palette.primary, backgroundColor: '#fdfdff' },
  typeTag: { fontSize: 9, fontWeight: '900', color: palette.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  msgText: { fontSize: 16, color: palette.muted, fontWeight: '600', lineHeight: 24 },
  msgTextBold: { color: palette.text, fontWeight: '800' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  footerDate: { fontSize: 11, fontWeight: '700', color: palette.muted },

  empty: { alignItems: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 13, fontWeight: '700', color: '#cbd5e1' },
})
