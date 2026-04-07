import DateTimePicker from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native'

import { palette } from '@/src/theme'

type DatePickerDialogProps = {
  visible: boolean
  value: Date
  onConfirm: (date: Date) => void
  onCancel: () => void
  title?: string
  minimumDate?: Date
  maximumDate?: Date
}

export function DatePickerDialog({
  visible,
  value,
  onConfirm,
  onCancel,
  title = 'Select Date',
  minimumDate,
  maximumDate,
}: DatePickerDialogProps) {
  const [tempDate, setTempDate] = useState(value)

  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (selected) onConfirm(selected)
      else onCancel()
      return
    }
    if (selected) setTempDate(selected)
  }

  if (Platform.OS === 'android') {
    if (!visible) return null
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={handleChange}
      />
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={styles.dialog} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={handleChange}
              textColor={palette.text}
              themeVariant="light"
            />
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={() => onConfirm(tempDate)}>
              <Text style={styles.confirmText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  )
}

type TimePickerDialogProps = {
  visible: boolean
  value: Date
  onConfirm: (date: Date) => void
  onCancel: () => void
  title?: string
  is24Hour?: boolean
}

export function TimePickerDialog({
  visible,
  value,
  onConfirm,
  onCancel,
  title = 'Select Time',
  is24Hour = false,
}: TimePickerDialogProps) {
  const [tempTime, setTempTime] = useState(value)

  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (selected) onConfirm(selected)
      else onCancel()
      return
    }
    if (selected) setTempTime(selected)
  }

  if (Platform.OS === 'android') {
    if (!visible) return null
    return (
      <DateTimePicker
        value={value}
        mode="time"
        display="default"
        is24Hour={is24Hour}
        onChange={handleChange}
      />
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={styles.dialog} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              is24Hour={is24Hour}
              onChange={handleChange}
              textColor={palette.text}
              themeVariant="light"
            />
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={() => onConfirm(tempTime)}>
              <Text style={styles.confirmText}>Confirm</Text>
            </Pressable>
          </View>
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
  },
  dialog: {
    width: '85%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerWrap: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.muted,
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.primaryMid,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
})
