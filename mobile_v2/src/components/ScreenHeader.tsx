import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from 'expo-router'
import { useRef, useState, type ReactNode } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { DrawerActions } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { palette } from '@/src/theme'
import { NotificationPopover } from './NotificationPopover'
import { QuickActionsModal } from './QuickActionsModal'

type Props = {
  title?: string
  onBack?: () => void
  onMenu?: () => void
  showNotification?: boolean
  onAddTask?: () => void
  onAddProject?: () => void
  onAddTeam?: () => void
  onAddMember?: () => void
  right?: ReactNode
}

export function ScreenHeader({ 
  title, onBack, onMenu, showNotification = true, 
  onAddTask, onAddProject, onAddTeam, onAddMember,
  right 
}: Props) {
  const insets = useSafeAreaInsets()
  const [menuVisible, setMenuVisible] = useState(false)
  const [notifVisible, setNotifVisible] = useState(false)
  const [notifAnchorTop, setNotifAnchorTop] = useState<number | undefined>(undefined)
  const [notifAnchorRight, setNotifAnchorRight] = useState<number | undefined>(undefined)
  const notifBtnRef = useRef<View | null>(null)

  const hasAddActions = onAddTask || onAddProject || onAddTeam || onAddMember

  function toggleNotifications() {
    if (notifVisible) {
      setNotifVisible(false)
      return
    }

    const target = notifBtnRef.current as any
    const winW = Dimensions.get('window').width

    // Prefer anchoring directly under the bell icon.
    if (target?.measureInWindow) {
      target.measureInWindow((x: number, y: number, w: number, h: number) => {
        const nextTop = Math.max(insets.top + 52, y + h + 0)
        const nextRight = Math.max(12, winW - (x + w))
        setNotifAnchorTop(nextTop)
        setNotifAnchorRight(nextRight)
        setNotifVisible(true)
      })
    } else {
      // Fallback: close enough under the header row.
      setNotifAnchorTop(insets.top + 88)
      setNotifAnchorRight(70)
      setNotifVisible(true)
    }
  }
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onMenu ? (
          <Pressable onPress={onMenu} style={styles.iconBox} hitSlop={12}>
            <Ionicons name="menu-outline" size={24} color={palette.textMuted} />
          </Pressable>
        ) : onBack ? (
          <Pressable onPress={onBack} style={styles.iconBox} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={palette.textMuted} />
          </Pressable>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.right}>
        {right}
        {showNotification && (
          <Pressable
            ref={notifBtnRef}
            onPress={toggleNotifications}
            style={[styles.iconBox, styles.whiteBox]}
            hitSlop={12}
          >
            <Ionicons name="notifications-outline" size={22} color={palette.textMuted} />
          </Pressable>
        )}
        {hasAddActions && (
          <Pressable onPress={() => setMenuVisible(true)} style={[styles.iconBox, styles.blueBox]} hitSlop={12}>
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        )}
        {!showNotification && !hasAddActions && !right && <View style={{ width: 48 }} />}
      </View>
      <NotificationPopover
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        anchorTop={notifAnchorTop}
        anchorRight={notifAnchorRight}
      />
      <QuickActionsModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onTask={() => onAddTask?.()}
        onProject={() => onAddProject?.()}
        onTeam={() => onAddTeam?.()}
        onMember={() => onAddMember?.()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    gap: 12,
  },
  left: { minWidth: 48 },
  right: { flexDirection: 'row', gap: 10, alignItems: 'center', minWidth: 48, justifyContent: 'flex-end' },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f1f5f9', // slate-100 style
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  blueBox: {
    backgroundColor: palette.primaryMid,
    borderRadius: 18,
    shadowColor: palette.primaryMid,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
})

/**
 * Same as ScreenHeader but opens the drawer menu — use on all main drawer stack screens
 * so you don’t repeat `navigation.dispatch(DrawerActions.openDrawer())` everywhere.
 */
export function DrawerScreenHeader(props: Omit<Props, 'onMenu'>) {
  const navigation = useNavigation()
  return (
    <ScreenHeader
      {...props}
      onMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
    />
  )
}
