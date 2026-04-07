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

export default function TaskNewScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { projectId: projectIdParam } = useLocalSearchParams<{ projectId?: string }>()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [projectId, setProjectId] = useState<string>(projectIdParam || '')
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

  const loadProjects = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
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
    if (projectIdParam && list.some(p => p.id === projectIdParam)) setProjectId(projectIdParam)
    else if (list.length === 1) setProjectId(list[0].id)
    setLoading(false)
  }, [projectIdParam])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

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
      const users = (urows || []) as { id: string; full_name: string | null; email: string | null }[]
      setAssignees(users)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user && users.some(u => u.id === user.id)) setAssignedTo(user.id)
      else if (users[0]) setAssignedTo(users[0].id)
    }
    loadMembers()
  }, [projectId])

  async function submit() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Enter a task title.')
      return
    }
    if (!projectId) {
      Alert.alert('Project required', 'Select a project.')
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        due_date: dueDate ? parseInputDate(dueDate)?.toISOString() ?? null : null,
        project_id: projectId,
        assigned_to: assignedTo || user.id,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    setSaving(false)
    if (error) {
      Alert.alert('Could not create task', error.message)
      return
    }
    if (data?.id) router.replace(`/task/${data.id}` as never)
    else router.back()
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
      <ScreenHeader title="New task" onBack={() => router.back()} />
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
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Task title" />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multiline]}
          placeholder="Details"
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
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Create task</Text>}
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
