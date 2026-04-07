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
import { SelectorModal } from './SelectorModal'

import { DatePickerDialog, TimePickerDialog } from '@/src/components/PickerDialog'
import { formatDateForInput, parseInputDate } from '@/src/lib/dateInput'
import { fetchProjectsForCurrentUser } from '@/src/lib/fetchUserProjects'
import { supabase } from '@/src/lib/supabase'
import { ProjectItem } from '@/src/types'
import { palette } from '@/src/theme'

type Props = {
  visible: boolean
  onClose: () => void
  onCreated?: () => void
  onCreateProject?: () => void
}

const PRIORITIES = ['low', 'medium', 'high'] as const
const STATUSES = ['pending', 'in_progress', 'review', 'completed'] as const

export function CreateTaskModal({ visible, onClose, onCreated, onCreateProject }: Props) {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  
  const [teams, setTeams] = useState<any[]>([])
  const [teamId, setTeamId] = useState<string | null>(null)
  
  const [members, setMembers] = useState<any[]>([])
  const [assigneeId, setAssigneeId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('pending')
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('medium')
  
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')

  const [loading, setLoading] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(true)
  
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  const [selVisible, setSelVisible] = useState(false)
  const [selTitle, setSelTitle] = useState('')
  const [selPlaceholder, setSelPlaceholder] = useState('')
  const [selAllowDefault, setSelAllowDefault] = useState(false)
  const [selOptions, setSelOptions] = useState<{ id: string; label: string }[]>([])
  const [selVal, setSelVal] = useState<string | null>(null)
  const [onSel, setOnSel] = useState<(v: string | null) => void>(() => {})

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ;(async () => {
      setLoadingInitial(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const pData = await fetchProjectsForCurrentUser('name_asc')
      
      if (!cancelled) {
        setProjects((pData || []) as ProjectItem[])
        setProjectId(null)
        setAssigneeId(null)
        setLoadingInitial(false)
      }
    })()
    return () => { cancelled = true }
  }, [visible])

  useEffect(() => {
    if (!projectId || !visible) {
      setMembers([])
      setTeams([])
      return
    }
    let cancelled = false
    ;(async () => {
      const [{ data: mData }, { data: tData }] = await Promise.all([
        supabase
          .from('project_members')
          .select('user:user_id(id, full_name, email)')
          .eq('project_id', projectId)
          .eq('status', 'accepted'),
        supabase
          .from('teams')
          .select('id, name')
          .eq('project_id', projectId)
          .order('name')
      ])

      if (!cancelled) {
        const memberList = (mData || []).map((m: any) => m.user).filter(Boolean)
        setMembers(memberList)
        setTeams(tData || [])
        setTeamId(null)
        setAssigneeId(null)
      }
    })()
    return () => { cancelled = true }
  }, [projectId, visible])

  async function submit() {
    if (!projectId || !title.trim()) {
      Alert.alert('Missing fields', 'Choose a project and enter a task title.')
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    setLoading(true)
    const { error } = await supabase.from('tasks').insert({
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      project_id: projectId,
      team_id: teamId,
      assigned_to: assigneeId,
      created_by: user.id,
      due_date: dueDate ? parseInputDate(dueDate)?.toISOString() ?? null : null,
      due_time: dueTime || null,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Could not create task', error.message)
      return
    }
    setTitle('')
    setDescription('')
    onClose()
    onCreated?.()
  }

  const openSelector = (
    title: string,
    options: any[],
    value: string | null,
    setter: (v: any) => void,
    placeholder = '',
    allowDefault = false
  ) => {
    setSelTitle(title)
    setSelPlaceholder(placeholder)
    setSelAllowDefault(allowDefault)
    setSelOptions(options)
    setSelVal(value)
    setOnSel(() => setter)
    setSelVisible(true)
  }

  const noProjects = !loadingInitial && projects.length === 0

  const openDatePicker = () => {
    setShowTimePicker(false)
    setShowDatePicker(true)
  }

  const openTimePicker = () => {
    setShowDatePicker(false)
    setShowTimePicker(true)
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Create Task</Text>
            <Text style={styles.headerSub}>DEFINE YOUR TASK PARAMETERS AND TIMELINE</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {loadingInitial ? (
            <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />
          ) : noProjects ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="grid-outline" size={36} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No Projects Found</Text>
              <Text style={styles.emptyDesc}>
                Missions require a project context. Create one first to begin tasking.
              </Text>
              <Pressable
                style={styles.emptyAction}
                onPress={() => {
                  onClose()
                  onCreateProject?.()
                }}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyActionText}>Create My First Project</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.grid}>
                <View style={styles.col}>
                  <Text style={styles.label}>Title *</Text>
                  <TextInput 
                    value={title} 
                    onChangeText={setTitle} 
                    style={[styles.input, title.length > 0 && styles.inputActive]} 
                    placeholder="Task title..." 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Project</Text>
                  <Pressable 
                    onPress={() => openSelector(
                      'Select Project', 
                      projects.map(p => ({ id: p.id, label: p.name })), 
                      projectId, 
                      setProjectId,
                      'Select Project',
                      true
                    )}
                    style={styles.select}
                  >
                    <Text style={[styles.selectText, !projectId && { color: '#9ca3af' }]}>
                      {projects.find(p => p.id === projectId)?.name || 'Select Project...'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.grid}>
                <View style={styles.col}>
                  <Text style={styles.label}>Team</Text>
                  <Pressable 
                    onPress={() => openSelector(
                      'Select Team', 
                      teams.map(t => ({ id: t.id, label: t.name })), 
                      teamId, 
                      setTeamId,
                      'Select Team',
                      true
                    )}
                    style={styles.select}
                  >
                    <Text style={[styles.selectText, !teamId && { color: '#9ca3af' }]}>
                      {teams.find(t => t.id === teamId)?.name || 'Select Team...'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                  </Pressable>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Assignee *</Text>
                  <Pressable 
                    onPress={() => openSelector(
                      'Select Assignee', 
                      members.map(m => ({ id: m.id, label: m.full_name || m.email })), 
                      assigneeId, 
                      setAssigneeId,
                      'Select Assignee',
                      true
                    )}
                    style={styles.select}
                  >
                    <Text style={[styles.selectText, !assigneeId && { color: '#9ca3af' }]}>
                      {members.find(m => m.id === assigneeId)?.full_name || 'Select Member...'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.grid}>
                <View style={styles.col}>
                  <Text style={styles.label}>Status</Text>
                  <Pressable 
                    onPress={() => openSelector(
                      'Select Status', 
                      STATUSES.map(s => ({ id: s, label: s === 'pending' ? 'To Do' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) })), 
                      status, 
                      setStatus as any
                    )}
                    style={styles.select}
                  >
                    <Text style={styles.selectText}>{status === 'pending' ? 'To Do' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                  </Pressable>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Priority</Text>
                  <Pressable 
                    onPress={() => openSelector(
                      'Select Priority', 
                      PRIORITIES.map(p => ({ id: p, label: p.charAt(0).toUpperCase() + p.slice(1) })), 
                      priority, 
                      setPriority as any
                    )}
                    style={styles.select}
                  >
                    <Text style={[styles.selectText, { textTransform: 'capitalize' }]}>{priority}</Text>
                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.grid}>
                <View style={styles.col}>
                  <Text style={styles.label}>Due Date</Text>
                  <Pressable onPress={openDatePicker} style={styles.select} hitSlop={8}>
                    <Text pointerEvents="none" style={[styles.selectText, !dueDate && { color: palette.muted }]}>
                      {dueDate || 'mm/dd/yyyy'}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#6366f1" pointerEvents="none" />
                  </Pressable>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Due Time</Text>
                  <Pressable onPress={openTimePicker} style={styles.select} hitSlop={8}>
                    <Text pointerEvents="none" style={[styles.selectText, !dueTime && { color: palette.muted }]}>
                      {dueTime || '--:-- --'}
                    </Text>
                    <Ionicons name="time-outline" size={18} color="#6366f1" pointerEvents="none" />
                  </Pressable>
                </View>
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.multiline]}
                placeholder="Operational details regarding the objective..."
                multiline
              />

              <Pressable disabled={loading} onPress={submit} style={styles.cta}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>Create Task</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
        <SelectorModal
          visible={selVisible}
          title={selTitle}
          placeholderLabel={selPlaceholder}
          allowDefaultSelect={selAllowDefault}
          options={selOptions}
          selectedValue={selVal}
          onSelect={onSel}
          onClose={() => setSelVisible(false)}
        />
      </KeyboardAvoidingView>

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
      <TimePickerDialog
        visible={showTimePicker}
        value={new Date()}
        title="Select Due Time"
        onConfirm={(d) => {
          setShowTimePicker(false)
          const hours = d.getHours().toString().padStart(2, '0')
          const minutes = d.getMinutes().toString().padStart(2, '0')
          setDueTime(`${hours}:${minutes}`)
        }}
        onCancel={() => setShowTimePicker(false)}
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
  grid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  col: { flex: 1 },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
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
  },
  inputActive: {
    borderColor: '#6366f1',
    backgroundColor: '#fff',
  },
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
  multiline: { height: 120, textAlignVertical: 'top', marginTop: 4 },
  cta: {
    marginTop: 12,
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
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: -0.5, marginBottom: 8 },
  emptyDesc: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8, lineHeight: 18, marginBottom: 24 },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyActionText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
})
