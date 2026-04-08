import { Ionicons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import { type Href, useRouter } from 'expo-router'
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { useNotifications } from '@/src/context/NotificationContext'
import { palette } from '@/src/theme'

const PREVIEW_LIMIT = 5

type Props = {
  visible: boolean
  onClose: () => void
  anchorRight?: number
  anchorTop?: number
}

export function NotificationPopover({ visible, onClose, anchorRight = 70, anchorTop = 100 }: Props) {
  const router = useRouter()
  const { items, unreadCount, markRead, markAllRead } = useNotifications()

  const preview = items.slice(0, PREVIEW_LIMIT)

  function goToAll() {
    onClose()
    router.push('/notifications' as Href)
  }

  async function handlePress(n: typeof items[0]) {
    await markRead(n.id)
    onClose()
    if (n.related_id) router.push(`/task/${n.related_id}` as Href)
    else router.push('/notifications' as Href)
  }

  if (!visible) return null

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={[s.popover, { top: anchorTop, right: anchorRight }]} onPress={() => {}}>
          <View style={s.header}>
            <Text style={s.title}>NOTIFICATIONS</Text>
            {unreadCount > 0 && (
              <Pressable onPress={markAllRead} hitSlop={8}>
                <Text style={s.markAllText}>Mark all read</Text>
              </Pressable>
            )}
          </View>

          {unreadCount > 0 && (
            <View style={s.countRow}>
              <View style={s.countPill}>
                <Text style={s.countText}>{unreadCount} unread</Text>
              </View>
            </View>
          )}

          {preview.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="notifications-off-outline" size={32} color="#e2e8f0" />
              <Text style={s.emptyText}>No notifications yet</Text>
            </View>
          ) : (
            <View style={s.list}>
              {preview.map(n => (
                <Pressable key={n.id} style={[s.item, !n.read && s.itemUnread]} onPress={() => handlePress(n)}>
                  <View style={s.itemDot}>
                    {!n.read && <View style={s.dot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemMsg} numberOfLines={2}>{n.message}</Text>
                    <Text style={s.itemTime}>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable style={s.seeAll} onPress={goToAll}>
            <Text style={s.seeAllText}>SEE ALL</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  popover: {
    position: 'absolute',
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.text,
    letterSpacing: 1,
  },
  markAllText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countRow: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  countPill: {
    alignSelf: 'flex-start',
    backgroundColor: palette.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.primary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.1)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.08)',
  },
  itemUnread: {
    backgroundColor: '#fafaff',
  },
  itemDot: {
    width: 10,
    paddingTop: 6,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
  itemMsg: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.text,
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 10,
    color: palette.muted,
    fontWeight: '600',
    marginTop: 3,
  },
  seeAll: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.12)',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.primaryMid,
    letterSpacing: 1,
  },
})
