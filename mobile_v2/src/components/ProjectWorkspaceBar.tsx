import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, View } from 'react-native'

import { palette } from '@/src/theme'

export type ProjectWorkspaceTab =
  | 'overview'
  | 'tasks'
  | 'activity'
  | 'teams'
  | 'members'
  | 'reports'
  | 'settings'

const INACTIVE_ICON = '#94a3b8'

const TABS: {
  key: ProjectWorkspaceTab
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  { key: 'overview', icon: 'home-outline' },
  { key: 'tasks', icon: 'clipboard-outline' },
  { key: 'activity', icon: 'pulse-outline' },
  { key: 'teams', icon: 'people-outline' },
  { key: 'members', icon: 'person-add-outline' },
  { key: 'reports', icon: 'bar-chart-outline' },
  { key: 'settings', icon: 'settings-outline' },
]

type Props = {
  active: ProjectWorkspaceTab
  onTabChange: (tab: ProjectWorkspaceTab) => void
}

export function ProjectWorkspaceBar({ active, onTabChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {TABS.map(({ key, icon }) => {
          const isActive = active === key
          return (
            <Pressable
              key={key}
              style={styles.slot}
              onPress={() => {
                if (!isActive) onTabChange(key)
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              hitSlop={6}
            >
              <View style={[styles.iconRing, isActive && styles.iconRingActive]}>
                <Ionicons name={icon} size={22} color={isActive ? palette.accent : INACTIVE_ICON} />
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 4,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f4f4f6',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.45)',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  iconRing: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconRingActive: {
    borderColor: 'rgba(148, 163, 184, 0.5)',
    backgroundColor: palette.surface,
  },
})
