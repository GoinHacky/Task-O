import { Ionicons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
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
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { ListSkeleton } from '@/src/components/Skeleton'
import { useNotifications } from '@/src/context/NotificationContext'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

export default function NotificationsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { items, unreadCount, loading, reload, markRead, markAllRead, clearAll, deleteOne } = useNotifications()
  const [refreshing, setRefreshing] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  function isInviteType(type: string) {
    return ['workspace_invite', 'project_invite', 'invite', 'team_invitation'].includes(type)
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
      Alert.alert(accept ? 'Accepted' : 'Declined')
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setProcessingId(null)
    }
  }

  function handleClearAll() {
    Alert.alert('Clear All', 'Delete all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearAll },
    ])
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        onBack={() => router.back()}
        showNotification={false}
        right={<Text style={styles.headerRightTitle}>Notifications</Text>}
      />
      {loading ? (
        <ListSkeleton />
      ) : (
      <FadeIn>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false) }} tintColor={palette.primary} />}
        >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Inbox</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadRow}>
                <View style={styles.unreadPill}><Text style={styles.unreadPillText}>{unreadCount}</Text></View>
                <Text style={styles.unreadLabel}>Unread messages</Text>
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

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="mail-open-outline" size={40} color="#e2e8f0" />
            <Text style={styles.emptyText}>You&apos;re all caught up.</Text>
          </View>
        ) : (
          items.map((n, idx) => (
            <Animated.View key={n.id} entering={FadeInDown.delay(idx * 30).duration(300)} layout={LinearTransition}>
              <Pressable
                style={[styles.card, !n.read && styles.cardUnread]}
                onPress={async () => {
                  if (!isInviteType(n.type)) {
                    await markRead(n.id)
                    if (n.related_id) router.push(`/task/${n.related_id}` as Href)
                  }
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.typePill}>{n.type.replace(/_/g, ' ')}</Text>
                  <View style={styles.cardActions}>
                    {!n.read && <View style={styles.unreadDot} />}
                    <Pressable onPress={() => deleteOne(n.id)} hitSlop={8}>
                      <Ionicons name="close" size={14} color="#94a3b8" />
                    </Pressable>
                  </View>
                </View>
                <Text style={[styles.message, !n.read && styles.messageBold]}>{n.message}</Text>
                <View style={styles.footer}>
                  <Ionicons name="time-outline" size={12} color={palette.muted} />
                  <Text style={styles.footerText}>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</Text>
                </View>

                {isInviteType(n.type) && !n.read && (
                  <View style={styles.inviteRow}>
                    <Pressable style={styles.acceptBtn} onPress={() => handleInvitation(n.id, n.related_id || undefined, true)} disabled={!!processingId}>
                      <Text style={styles.acceptText}>{processingId === n.id ? '...' : 'Accept'}</Text>
                    </Pressable>
                    <Pressable style={styles.declineBtn} onPress={() => handleInvitation(n.id, n.related_id || undefined, false)} disabled={!!processingId}>
                      <Text style={styles.declineText}>Decline</Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          ))
        )}
        </ScrollView>
      </FadeIn>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 },
  headerRightTitle: { fontSize: 14, fontWeight: '900', color: palette.text, letterSpacing: 0.3 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: palette.text, letterSpacing: -0.5 },
  unreadRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  unreadPill: { backgroundColor: palette.accentSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  unreadPillText: { fontSize: 11, fontWeight: '900', color: palette.primary },
  unreadLabel: { fontSize: 11, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.5 },

  headerActions: { flexDirection: 'row', gap: 6, paddingTop: 4 },
  hBtn: { backgroundColor: palette.accentSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  hBtnText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: palette.primary, letterSpacing: 0.5 },
  clearBtn: { backgroundColor: '#fef2f2' },
  clearBtnText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: '#ef4444', letterSpacing: 0.5 },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '700', color: palette.muted, fontStyle: 'italic' },

  card: { backgroundColor: palette.surface, borderRadius: 20, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(148,163,184,0.1)', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  cardUnread: { borderColor: 'rgba(99,102,241,0.2)', backgroundColor: '#fdfdff' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typePill: { fontSize: 9, fontWeight: '900', color: palette.primary, textTransform: 'uppercase', letterSpacing: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary },
  message: { fontSize: 15, color: palette.muted, fontWeight: '600', lineHeight: 22 },
  messageBold: { color: palette.text, fontWeight: '800' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  footerText: { fontSize: 11, fontWeight: '700', color: palette.muted },

  inviteRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  acceptBtn: { flex: 1, backgroundColor: palette.primary, paddingVertical: 12, borderRadius: 14, alignItems: 'center', shadowColor: palette.primary, shadowOpacity: 0.2, shadowRadius: 8 },
  acceptText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  declineBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  declineText: { color: palette.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
})
