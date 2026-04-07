import { Ionicons } from '@expo/vector-icons'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { palette } from '@/src/theme'

type ActionItem = {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  onPress: () => void
}

type Props = {
  visible: boolean
  onClose: () => void
  onTask: () => void
  onProject: () => void
  onTeam: () => void
  onMember: () => void
}

export function QuickActionsModal({ visible, onClose, onTask, onProject, onTeam, onMember }: Props) {
  const items: ActionItem[] = [
    { label: 'New Task', icon: 'add-outline', color: '#6366f1', onPress: onTask },
    { label: 'New Project', icon: 'grid-outline', color: '#10b981', onPress: onProject },
    { label: 'New Team', icon: 'people-outline', color: '#0ea5e9', onPress: onTeam },
    { label: 'New Member', icon: 'person-add-outline', color: '#8b5cf6', onPress: onMember },
  ]

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.dropdown}>
          {items.map((item, idx) => (
            <Pressable
              key={idx}
              style={({ pressed }) => [
                styles.item,
                pressed && { backgroundColor: '#f8fafc' },
                idx < items.length - 1 && styles.border
              ]}
              onPress={() => {
                onClose()
                item.onPress()
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.label}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 110, // Adjust based on header height
    paddingHorizontal: 16,
  },
  dropdown: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.1)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 16,
  },
  border: {
    // marginBottom: 2
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155', // slate-700 style
    letterSpacing: -0.3,
  },
})
