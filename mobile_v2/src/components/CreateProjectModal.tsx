import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { DatePickerDialog } from '@/src/components/PickerDialog'
import { formatDateForInput, parseInputDate } from '@/src/lib/dateInput'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type Props = {
  visible: boolean
  onClose: () => void
  onCreated?: () => void
}

const STATUSES = ['planning', 'active', 'archived'] as const

export function CreateProjectModal({ visible, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('planning')
  const [loading, setLoading] = useState(false)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  useEffect(() => {
    if (visible) {
      setName('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setStatus('planning')
    }
  }, [visible])

  async function submit() {
    if (!name.trim()) {
      Alert.alert('Missing fields', 'Please enter a project name.')
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setLoading(true)

    const { data: project, error: projError } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        status,
        start_date: startDate ? parseInputDate(startDate)?.toISOString().split('T')[0] ?? null : null,
        end_date: endDate ? parseInputDate(endDate)?.toISOString().split('T')[0] ?? null : null,
        owner_id: user.id,
      })
      .select('id')
      .single()

    if (projError || !project) {
      setLoading(false)
      Alert.alert('Could not create project', projError?.message || 'Unknown error')
      return
    }

    const { error: memError } = await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: user.id,
      role: 'admin',
      status: 'accepted',
    })

    setLoading(false)

    if (memError) {
      Alert.alert('Project created, but could not add you as member', memError.message)
    }

    onClose()
    onCreated?.()
  }

  const openStartPicker = () => {
    setShowEndPicker(false)
    setShowStartPicker(true)
  }

  const openEndPicker = () => {
    setShowStartPicker(false)
    setShowEndPicker(true)
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Create Project</Text>
            <Text style={styles.headerSub}>DEFINE YOUR PROJECT SCOPE AND TIMELINE</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Project Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, name.length > 0 && styles.inputActive]}
            placeholder="Project Name"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.multiline]}
            placeholder="Outline the purpose and scope..."
            placeholderTextColor="#9ca3af"
            multiline
          />

          <View style={styles.grid}>
            <View style={styles.col}>
              <Text style={styles.label}>Start Date</Text>
              <Pressable onPress={openStartPicker} style={styles.select} hitSlop={8}>
                <Text pointerEvents="none" style={[styles.selectText, !startDate && { color: '#9ca3af' }]}>
                  {startDate || 'mm/dd/yyyy'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#6366f1" pointerEvents="none" />
              </Pressable>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>End Date</Text>
              <Pressable onPress={openEndPicker} style={styles.select} hitSlop={8}>
                <Text pointerEvents="none" style={[styles.selectText, !endDate && { color: '#9ca3af' }]}>
                  {endDate || 'mm/dd/yyyy'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#6366f1" pointerEvents="none" />
              </Pressable>
            </View>
          </View>

          <Text style={styles.label}>Project Status</Text>
          <View style={styles.statusRow}>
            {STATUSES.map(s => {
              const isActive = status === s
              const dotColor = s === 'planning' ? '#f59e0b' : s === 'active' ? '#10b981' : '#64748b'
              return (
                <Pressable
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[styles.statusItem, isActive && styles.statusItemActive]}
                >
                  <View style={[styles.dot, { backgroundColor: dotColor }]} />
                  <Text style={[styles.statusText, isActive && styles.statusTextActive]}>{s.toUpperCase()}</Text>
                </Pressable>
              )
            })}
          </View>

          <Pressable disabled={loading} onPress={submit} style={styles.cta}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Create Project</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerDialog
        visible={showStartPicker}
        value={startDate ? parseInputDate(startDate) ?? new Date() : new Date()}
        title="Select Start Date"
        minimumDate={new Date()}
        onConfirm={(d) => {
          setShowStartPicker(false)
          const formatted = formatDateForInput(d)
          setStartDate(formatted)
          const parsedEnd = endDate ? parseInputDate(endDate) : null
          if (parsedEnd && parsedEnd < d) setEndDate('')
        }}
        onCancel={() => setShowStartPicker(false)}
      />
      <DatePickerDialog
        visible={showEndPicker}
        value={endDate ? parseInputDate(endDate) ?? new Date() : (startDate ? parseInputDate(startDate) ?? new Date() : new Date())}
        title="Select End Date"
        minimumDate={startDate ? parseInputDate(startDate) ?? new Date() : new Date()}
        onConfirm={(d) => {
          setShowEndPicker(false)
          setEndDate(formatDateForInput(d))
        }}
        onCancel={() => setShowEndPicker(false)}
      />
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: palette.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    backgroundColor: palette.bg,
  },
  headerContent: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1e293b', letterSpacing: -1 },
  headerSub: { fontSize: 11, fontWeight: '900', color: '#94a3b8', marginTop: 8, letterSpacing: 1 },
  body: { paddingHorizontal: 24, paddingBottom: 60 },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 20,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: '#f8fafc',
    color: palette.text,
    fontWeight: '600',
  },
  inputActive: {
    borderColor: '#6366f1',
    backgroundColor: '#fff',
  },
  grid: { flexDirection: 'row', gap: 12, marginTop: 4 },
  col: { flex: 1 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
  },
  selectText: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statusItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  statusItemActive: {
    backgroundColor: '#fff',
    borderColor: '#6366f1',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 0.5 },
  statusTextActive: { color: '#6366f1' },
  cta: {
    marginTop: 32,
    backgroundColor: palette.primaryMid,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: palette.primaryMid,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
})
