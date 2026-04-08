import { Ionicons } from '@expo/vector-icons'
import { type Href, useLocalSearchParams, useRouter } from 'expo-router'
import { format, parseISO } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { FadeIn } from '@/src/components/FadeIn'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { SelectorModal } from '@/src/components/SelectorModal'
import { BoardSkeleton } from '@/src/components/Skeleton'
import { supabase } from '@/src/lib/supabase'
import { UserAvatar } from '@/src/components/UserAvatar'
import type { TaskItem, TaskStatus } from '@/src/types'
import { palette } from '@/src/theme'

type UserInfo = { full_name: string | null; avatar_url: string | null }

const STATUS_FILTER_OPTIONS: { id: string; label: string }[] = [
  { id: 'all', label: 'All status' },
  { id: 'pending', label: 'To do' },
  { id: 'in_progress', label: 'Doing' },
  { id: 'review', label: 'Review' },
  { id: 'completed', label: 'Done' },
]

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'pending', label: 'To Do', color: '#0096C7' },
  { key: 'in_progress', label: 'In Progress', color: '#CF7929' },
  { key: 'review', label: 'Review', color: '#6366f1' },
  { key: 'completed', label: 'Done', color: '#1E9E74' },
]

type ViewMode = 'board' | 'list' | 'grid'

function priorityBorder(p: TaskItem['priority']) {
  if (p === 'high') return palette.danger
  if (p === 'medium') return palette.warning
  if (p === 'low') return palette.primaryMid
  return '#e2e8f0'
}

function formatDue(due: string | null) {
  if (!due) return '—'
  try {
    return format(parseISO(due.length > 10 ? due : `${due}T12:00:00`), 'MMM dd')
  } catch {
    return '—'
  }
}

function TaskCard({ task, assignee, onPress }: { task: TaskItem; assignee?: UserInfo | null; onPress: () => void }) {
  const borderLeft = priorityBorder(task.priority)

  return (
    <Pressable
      style={[styles.taskCard, { borderLeftColor: borderLeft, borderLeftWidth: 4 }]}
      onPress={onPress}
    >
      <View style={styles.taskCardInner}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {task.title}
        </Text>
        {task.description ? (
          <Text style={styles.taskDesc} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}
        <View style={styles.taskFooter}>
          <View style={styles.taskPriRow}>
            <View style={[styles.taskPriDot, { backgroundColor: borderLeft }]} />
            <Text style={styles.taskPriLabel}>{task.priority || '—'}</Text>
          </View>
          <View style={styles.taskFooterRight}>
            <View style={styles.duePill}>
              <Ionicons name="calendar-outline" size={11} color={palette.muted} />
              <Text style={styles.dueText}>{formatDue(task.due_date)}</Text>
            </View>
            <UserAvatar uri={assignee?.avatar_url} name={assignee?.full_name || (task.assigned_to ? '?' : '—')} size={28} />
          </View>
        </View>
      </View>
    </Pressable>
  )
}

export default function ProjectTasksScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id: projectId } = useLocalSearchParams<{ id: string }>()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [userMap, setUserMap] = useState<Record<string, UserInfo>>({})

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }
    const { data: project } = await supabase.from('projects').select('name, description').eq('id', projectId).single()
    if (project) {
      setProjectName((project as { name: string }).name)
      setProjectDesc((project as { description: string | null }).description)
    }
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    const taskList = (data || []) as TaskItem[]
    setTasks(taskList)
    const uids = [...new Set(taskList.map(t => t.assigned_to).filter(Boolean) as string[])]
    if (uids.length > 0) {
      const { data: users } = await supabase.from('users').select('id, full_name, avatar_url').in('id', uids)
      const m: Record<string, UserInfo> = {}
      for (const u of (users || []) as { id: string; full_name: string | null; avatar_url: string | null }[]) {
        m[u.id] = u
      }
      setUserMap(m)
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    let list = tasks
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      )
    }
    if (statusFilter !== 'all') {
      list = list.filter(t => t.status === statusFilter)
    }
    return list
  }, [tasks, search, statusFilter])

  const grouped = useMemo(() => {
    const m: Record<TaskStatus, TaskItem[]> = {
      pending: [],
      in_progress: [],
      review: [],
      completed: [],
    }
    for (const t of filtered) {
      if (m[t.status]) m[t.status].push(t)
    }
    return m
  }, [filtered])

  const statusTriggerLabel =
    STATUS_FILTER_OPTIONS.find(o => o.id === statusFilter)?.label.toUpperCase() ?? 'ALL STATUS'

  function openCalendar() {
    if (projectId) router.push(`/project/${projectId}/calendar` as Href)
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader title="Project tasks" onBack={() => router.back()} />

      {loading ? (
        <BoardSkeleton />
      ) : (
      <FadeIn>
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.headBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.h1Project} numberOfLines={2}>
              {(projectName || 'Project').toUpperCase()}
            </Text>
            <Text style={styles.h1Slash}>/</Text>
          </View>
          <Text style={styles.h1Sub}>PROJECT TASKS</Text>
          {projectDesc ? (
            <Text style={styles.descCaps} numberOfLines={4}>
              {projectDesc.toUpperCase()}
            </Text>
          ) : null}
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={palette.muted} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="SEARCH TASKS..."
            placeholderTextColor={palette.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.toolbar}>
          <View style={styles.viewToggles}>
            <Pressable
              style={[styles.viewBtn, viewMode === 'board' && styles.viewBtnOn]}
              onPress={() => setViewMode('board')}
            >
              <Ionicons
                name="albums-outline"
                size={16}
                color={viewMode === 'board' ? palette.accent : palette.muted}
              />
            </Pressable>
            <Pressable
              style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnOn]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={viewMode === 'grid' ? palette.accent : palette.muted}
              />
            </Pressable>
            <Pressable
              style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnOn]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={viewMode === 'list' ? palette.accent : palette.muted}
              />
            </Pressable>
            <Pressable style={styles.viewBtn} onPress={openCalendar}>
              <Ionicons name="calendar-outline" size={16} color={palette.muted} />
            </Pressable>
          </View>

          <Pressable style={styles.statusTrigger} onPress={() => setStatusModalOpen(true)}>
            <Text style={styles.statusTriggerText}>{statusTriggerLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={palette.muted} />
          </Pressable>

          <Pressable
            style={styles.newTaskBtn}
            onPress={() => projectId && router.push(`/task/new?projectId=${projectId}` as Href)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.newTaskBtnText}>NEW TASK</Text>
          </Pressable>
        </View>

        {viewMode === 'board' && (
          <View style={styles.board}>
            {COLUMNS.map(col => (
              <View key={col.key} style={styles.column}>
                <View style={[styles.colHeader, { backgroundColor: col.color }]}>
                  <Text style={styles.colHeaderTitle}>{col.label}</Text>
                  <View style={styles.colCount}>
                    <Text style={styles.colCountText}>{grouped[col.key].length}</Text>
                  </View>
                </View>
                <View style={styles.colBody}>
                  {grouped[col.key].length === 0 ? (
                    <View style={styles.colEmpty} />
                  ) : (
                    grouped[col.key].map(t => (
                      <TaskCard key={t.id} task={t} assignee={t.assigned_to ? userMap[t.assigned_to] : null} onPress={() => router.push(`/task/${t.id}` as Href)} />
                    ))
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {viewMode === 'list' && (
          <View style={styles.listBlock}>
            {filtered.length === 0 ? (
              <Text style={styles.empty}>No tasks match your filters.</Text>
            ) : (
              filtered.map(t => (
                <TaskCard key={t.id} task={t} assignee={t.assigned_to ? userMap[t.assigned_to] : null} onPress={() => router.push(`/task/${t.id}` as Href)} />
              ))
            )}
          </View>
        )}

        {viewMode === 'grid' && (
          <View style={styles.gridBlock}>
            {filtered.length === 0 ? (
              <Text style={styles.empty}>No tasks match your filters.</Text>
            ) : (
              filtered.map(t => (
                <View key={t.id} style={styles.gridCell}>
                  <TaskCard task={t} assignee={t.assigned_to ? userMap[t.assigned_to] : null} onPress={() => router.push(`/task/${t.id}` as Href)} />
                </View>
              ))
            )}
          </View>
        )}
        </ScrollView>
      </FadeIn>
      )}

      <SelectorModal
        visible={statusModalOpen}
        title="Status"
        options={STATUS_FILTER_OPTIONS.map(o => ({ id: o.id, label: o.label }))}
        selectedValue={statusFilter}
        onSelect={v => setStatusFilter(v ?? 'all')}
        onClose={() => setStatusModalOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: palette.bg,
  },
  back: { padding: 8 },
  scrollBody: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
  headBlock: { gap: 8, marginTop: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  h1Project: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: palette.text,
    textTransform: 'uppercase',
    maxWidth: '90%',
  },
  h1Slash: { fontSize: 22, fontWeight: '200', color: '#e2e8f0', marginLeft: 8 },
  h1Sub: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    color: palette.text,
    textTransform: 'uppercase',
  },
  descCaps: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    letterSpacing: 2,
    lineHeight: 16,
  },
  searchWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
  },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  searchInput: {
    flex: 1,
    paddingLeft: 42,
    paddingRight: 16,
    paddingVertical: 14,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: palette.text,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  viewToggles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
  },
  viewBtn: {
    padding: 8,
    borderRadius: 10,
  },
  viewBtnOn: {
    backgroundColor: palette.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  statusTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    flexGrow: 1,
    minWidth: 120,
  },
  statusTriggerText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: palette.textMuted,
    textTransform: 'uppercase',
  },
  newTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: palette.accent,
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  newTaskBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#fff',
  },
  board: { gap: 20, marginTop: 8 },
  column: { gap: 0 },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  colHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  colCount: {
    minWidth: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  colCountText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  colBody: {
    minHeight: 120,
    borderRadius: 28,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  colEmpty: { minHeight: 80 },
  listBlock: { gap: 12, marginTop: 8 },
  gridBlock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  gridCell: { width: '47%', flexGrow: 1, minWidth: 140 },
  taskCard: {
    borderRadius: 22,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  taskCardInner: { padding: 18, gap: 10 },
  taskTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  taskDesc: {
    fontSize: 11,
    fontStyle: 'italic',
    color: palette.muted,
    fontWeight: '700',
    lineHeight: 16,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(248, 250, 252, 0.9)',
  },
  taskPriRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskPriDot: { width: 6, height: 6, borderRadius: 99 },
  taskPriLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  taskFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  duePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  dueText: { fontSize: 9, fontWeight: '900', color: palette.muted, textTransform: 'uppercase' },
  avatarChip: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 10, fontWeight: '900', color: palette.accent },
  empty: {
    textAlign: 'center',
    color: palette.muted,
    fontWeight: '600',
    marginTop: 24,
    paddingHorizontal: 16,
  },
})
