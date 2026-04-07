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
  placeholderLabel?: string
  allowDefaultSelect?: boolean
  options: Option[]
  selectedValue: string | null
  onSelect: (value: string | null) => void
  onClose: () => void
}

export function SelectorModal({
  visible,
  title,
  placeholderLabel,
  allowDefaultSelect = false,
  options,
  selectedValue,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.dialog} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {placeholderLabel ? (
              allowDefaultSelect ? (
                <Pressable
                  style={[styles.item, styles.defaultItem, !selectedValue && styles.itemActive]}
                  onPress={() => {
                    onSelect(null)
                    onClose()
                  }}
                >
                  <Text style={[styles.itemText, styles.placeholderText, !selectedValue && styles.itemTextActive]}>
                    {placeholderLabel}
                  </Text>
                  {!selectedValue && <Ionicons name="checkmark-circle" size={20} color={palette.primaryMid} />}
                </Pressable>
              ) : (
                <View style={styles.placeholderRow}>
                  <Text style={styles.placeholderText}>{placeholderLabel}</Text>
                </View>
              )
            ) : null}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '85%',
    maxWidth: 360,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '800', color: palette.text, textAlign: 'center' },
  list: { padding: 10 },
  placeholderRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  placeholderText: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '600',
  },
  defaultItem: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    backgroundColor: '#fff',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: '#f8fafc',
  },
  itemActive: { backgroundColor: '#f3f4ff' },
  itemText: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  itemTextActive: { color: palette.primaryMid, fontWeight: '800' },
})
