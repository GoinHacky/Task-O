import { Ionicons } from '@expo/vector-icons'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { palette } from '@/src/theme'

type Option = {
  id: string
  label: string
}

type Props = {
  visible: boolean
  title: string
  options: Option[]
  selectedValue: string | null
  onSelect: (value: string) => void
  onClose: () => void
}

export function SelectorModal({ visible, title, options, selectedValue, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {options.map((opt) => {
              const isActive = opt.id === selectedValue
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.item, isActive && styles.itemActive]}
                  onPress={() => {
                    onSelect(opt.id)
                    onClose()
                  }}
                >
                  <Text style={[styles.itemText, isActive && styles.itemTextActive]}>{opt.label}</Text>
                  {isActive && <Ionicons name="checkmark-circle" size={20} color="#6366f1" />}
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  title: { fontSize: 13, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  list: { padding: 8 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 4,
  },
  itemActive: { backgroundColor: '#f5f3ff' },
  itemText: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  itemTextActive: { color: '#6366f1', fontWeight: '800' },
})
