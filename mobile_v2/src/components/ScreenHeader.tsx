import { Ionicons } from '@expo/vector-icons'
import { useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { palette } from '@/src/theme'
import { QuickActionsModal } from './QuickActionsModal'

type Props = {
  title?: string
  onBack?: () => void
  onMenu?: () => void
  onNotification?: () => void
  onAddTask?: () => void
  onAddProject?: () => void
  onAddTeam?: () => void
  onAddMember?: () => void
  right?: ReactNode
}

export function ScreenHeader({ 
  title, onBack, onMenu, onNotification, 
  onAddTask, onAddProject, onAddTeam, onAddMember,
  right 
}: Props) {
  const [menuVisible, setMenuVisible] = useState(false)
  const hasAddActions = onAddTask || onAddProject || onAddTeam || onAddMember
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
        {onNotification && (
          <Pressable onPress={onNotification} style={[styles.iconBox, styles.whiteBox]} hitSlop={12}>
            <Ionicons name="notifications-outline" size={22} color={palette.textMuted} />
          </Pressable>
        )}
        {hasAddActions && (
          <Pressable onPress={() => setMenuVisible(true)} style={[styles.iconBox, styles.blueBox]} hitSlop={12}>
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        )}
        {!onNotification && !hasAddActions && !right && <View style={{ width: 48 }} />}
      </View>
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
