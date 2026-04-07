import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { DatePickerDialog } from '@/src/components/PickerDialog'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { formatDateForInput, parseInputDate } from '@/src/lib/dateInput'
import { supabase } from '@/src/lib/supabase'
import { TaskItem } from '@/src/types'
import { palette } from '@/src/theme'

type ProjectRow = { id: string; name: string }

export default function TaskEditScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [projectId, setProjectId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskItem['status']>('pending')
  const [priority, setPriority] = useState<NonNullable<TaskItem['priority']>>('medium')
  const [dueDate, setDueDate] = useState('')
  const [assignees, setAssignees] = useState<{ id: string; full_name: string | null; email: string | null }[]>([])
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single()
    if (!task) {
      setLoading(false)
      return
    }
    const t = task as TaskItem
    setTitle(t.title)
    setDescription(t.description || '')
    setStatus(t.status)
    setPriority((t.priority as NonNullable<TaskItem['priority']>) || 'medium')
    setDueDate(t.due_date ? formatDateForInput(new Date(t.due_date)) : '')
    setAssignedTo(t.assigned_to || '')
    setProjectId(t.project_id || '')

    const { data: mem } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
    const pids = [...new Set((mem || []).map(m => (m as { project_id: string }).project_id).filter(Boolean))]
    const { data: fromMem } =
      pids.length > 0 ? await supabase.from('projects').select('id, name').in('id', pids) : { data: [] }
    const list: ProjectRow[] = ((fromMem || []) as ProjectRow[]).slice()
    const { data: owned } = await supabase.from('projects').select('id, name').eq('owner_id', user.id)
    for (const o of owned || []) {
      const row = o as ProjectRow
      if (!list.find(x => x.id === row.id)) list.push(row)
    }
    setProjects(list)

    if (t.project_id) {
      const { data: members } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', t.project_id)
        .eq('status', 'accepted')
      const muids = (members || []).map(m => (m as { user_id: string }).user_id).filter(Boolean)
      const { data: urows } =
        muids.length > 0 ? await supabase.from('users').select('id, full_name, email').in('id', muids) : { data: [] }
      setAssignees((urows || []) as { id: string; full_name: string | null; email: string | null }[])
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    async function loadMembers() {
      if (!projectId) {
        setAssignees([])
        return
      }
      const { data: members } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('status', 'accepted')
      const muids = (members || []).map(m => (m as { user_id: string }).user_id).filter(Boolean)
      const { data: urows } =
        muids.length > 0 ? await supabase.from('users').select('id, full_name, email').in('id', muids) : { data: [] }
      setAssignees((urows || []) as { id: string; full_name: string | null; email: string | null }[])
    }
    loadMembers()
  }, [projectId])

  async function submit() {
    if (!id || !title.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('tasks')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        due_date: dueDate ? parseInputDate(dueDate)?.toISOString() ?? null : null,
        project_id: projectId || null,
        assigned_to: assignedTo || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    setSaving(false)
    if (error) Alert.alert('Update failed', error.message)
    else router.replace(`/task/${id}` as never)
  }

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  const statuses: TaskItem['status'][] = ['pending', 'in_progress', 'review', 'completed']
  const priorities: NonNullable<TaskItem['priority']>[] = ['low', 'medium', 'high']

  return (
    <KeyboardAvoidingView
      style={[styles.safe, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={8}
    >
      <ScreenHeader title="Edit task" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Text style={styles.label}>Project</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {projects.map(p => (
            <Pressable
              key={p.id}
              onPress={() => setProjectId(p.id)}
              style={[styles.chip, projectId === p.id && styles.chipOn]}
            >
              <Text style={[styles.chipText, projectId === p.id && styles.chipTextOn]}>{p.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multiline]}
          multiline
        />

        <Text style={styles.label}>Status</Text>
        <View style={styles.row}>
          {statuses.map(s => (
            <Pressable key={s} onPress={() => setStatus(s)} style={[styles.chip, status === s && styles.chipOn]}>
              <Text style={[styles.chipText, status === s && styles.chipTextOn]}>{s.replace('_', ' ')}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Priority</Text>
        <View style={styles.row}>
          {priorities.map(p => (
            <Pressable key={p} onPress={() => setPriority(p)} style={[styles.chip, priority === p && styles.chipOn]}>
              <Text style={[styles.chipText, priority === p && styles.chipTextOn]}>{p}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Due date</Text>
        <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateBtn}>
          <Text style={[styles.dateBtnText, !dueDate && { color: palette.muted }]}>
            {dueDate || 'mm/dd/yyyy'}
          </Text>
          <Ionicons name="calendar-outline" size={18} color={palette.primaryMid} />
        </Pressable>

        <Text style={styles.label}>Assignee</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {assignees.map(u => (
            <Pressable
              key={u.id}
              onPress={() => setAssignedTo(u.id)}
              style={[styles.chip, assignedTo === u.id && styles.chipOn]}
            >
              <Text style={[styles.chipText, assignedTo === u.id && styles.chipTextOn]}>
                {u.full_name || u.email || u.id.slice(0, 6)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable style={styles.save} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save changes</Text>}
        </Pressable>
      </ScrollView>

      <DatePickerDialog
        visible={showDatePicker}
        value={dueDate ? parseInputDate(dueDate) ?? new Date() : new Date()}
        title="Select Due Date"
        onConfirm={(d) => {
          setShowDatePicker(false)
          setDueDate(formatDateForInput(d))
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  body: { padding: 16, paddingBottom: 48 },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.muted,
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    color: palette.text,
    backgroundColor: palette.surface,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chips: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  chipOn: { borderColor: palette.accent, backgroundColor: palette.accentSoft },
  chipText: { fontSize: 12, fontWeight: '700', color: palette.muted, textTransform: 'capitalize' },
  chipTextOn: { color: palette.primaryMid },
  save: {
    marginTop: 28,
    backgroundColor: palette.primaryMid,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 12,
    backgroundColor: palette.surface,
  },
  dateBtnText: { fontSize: 15, fontWeight: '700', color: palette.text },
})
