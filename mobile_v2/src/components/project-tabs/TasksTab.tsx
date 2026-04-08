import { Ionicons } from '@expo/vector-icons'
import { useRouter, type Href } from 'expo-router'
import { format, parseISO } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { FadeIn } from '@/src/components/FadeIn'
import { SelectorModal } from '@/src/components/SelectorModal'
import { BoardSkeleton } from '@/src/components/Skeleton'
import { supabase } from '@/src/lib/supabase'
import { UserAvatar } from '@/src/components/UserAvatar'
import type { TaskItem, TaskStatus } from '@/src/types'
import { palette } from '@/src/theme'

type UserInfo = { full_name: string | null; avatar_url: string | null }

const STATUS_OPTS = [
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

function priBorder(p: TaskItem['priority']) {
  if (p === 'high') return palette.danger
  if (p === 'medium') return palette.warning
  if (p === 'low') return palette.primaryMid
  return '#e2e8f0'
}
function fmtDue(d: string | null) {
  if (!d) return '—'
  try { return format(parseISO(d.length > 10 ? d : `${d}T12:00:00`), 'MMM dd') } catch { return '—' }
}

function TaskCard({ task, assignee, onPress }: { task: TaskItem; assignee?: UserInfo | null; onPress: () => void }) {
  const bc = priBorder(task.priority)
  return (
    <Pressable style={[s.taskCard, { borderLeftColor: bc, borderLeftWidth: 4 }]} onPress={onPress}>
      <View style={s.taskInner}>
        <Text style={s.taskTitle} numberOfLines={2}>{task.title}</Text>
        {task.description ? <Text style={s.taskDesc} numberOfLines={2}>{task.description}</Text> : null}
        <View style={s.taskFoot}>
          <View style={s.priRow}><View style={[s.priDot, { backgroundColor: bc }]} /><Text style={s.priLabel}>{task.priority || '—'}</Text></View>
          <View style={s.footRight}>
            <View style={s.duePill}><Ionicons name="calendar-outline" size={11} color={palette.muted} /><Text style={s.dueText}>{fmtDue(task.due_date)}</Text></View>
            <UserAvatar uri={assignee?.avatar_url} name={assignee?.full_name || (task.assigned_to ? '?' : '—')} size={28} />
          </View>
        </View>
      </View>
    </Pressable>
  )
}

export function TasksTab({
  projectId,
  onOpenNewTask,
  tasksRefreshKey = 0,
}: {
  projectId: string
  /** Opens the shared CreateTaskModal from ProjectDetailScreen (or parent). */
  onOpenNewTask?: () => void
  /** Increment after a task is created to reload the board. */
  tasksRefreshKey?: number
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [statusModal, setStatusModal] = useState(false)
  const [userMap, setUserMap] = useState<Record<string, UserInfo>>({})

  const load = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
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
  }, [load, tasksRefreshKey])

  const filtered = useMemo(() => {
    let list = tasks
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter)
    return list
  }, [tasks, statusFilter])

  const grouped = useMemo(() => {
    const m: Record<TaskStatus, TaskItem[]> = { pending: [], in_progress: [], review: [], completed: [] }
    for (const t of filtered) if (m[t.status]) m[t.status].push(t)
    return m
  }, [filtered])

  if (loading) return <BoardSkeleton />

  return (
    <FadeIn>
    <View style={s.root}>
      <View style={s.toolbar}>
        <View style={s.viewToggles}>
          {(['board', 'list'] as const).map(vm => (
            <Pressable key={vm} style={[s.viewBtn, viewMode === vm && s.viewBtnOn]} onPress={() => setViewMode(vm)}>
              <Ionicons name={vm === 'board' ? 'albums-outline' : 'list-outline'} size={16} color={viewMode === vm ? palette.accent : palette.muted} />
            </Pressable>
          ))}
          <Pressable style={s.viewBtn} onPress={() => router.push(`/project/${projectId}/calendar` as Href)}>
            <Ionicons name="calendar-outline" size={16} color={palette.muted} />
          </Pressable>
        </View>
        <Pressable style={s.statusTrigger} onPress={() => setStatusModal(true)}>
          <Text style={s.statusText}>{(STATUS_OPTS.find(o => o.id === statusFilter)?.label ?? 'All status').toUpperCase()}</Text>
          <Ionicons name="chevron-down" size={14} color={palette.muted} />
        </Pressable>
        <Pressable
          style={s.newBtn}
          onPress={() => (onOpenNewTask ? onOpenNewTask() : router.push(`/task/new?projectId=${projectId}` as Href))}
        >
          <Ionicons name="add" size={18} color="#fff" /><Text style={s.newBtnT}>NEW TASK</Text>
        </Pressable>
      </View>

      {viewMode === 'board' && (
        <View style={s.board}>
          {COLUMNS.map(col => (
            <View key={col.key}>
              <View style={[s.colHead, { backgroundColor: col.color }]}>
                <Text style={s.colTitle}>{col.label}</Text>
                <View style={s.colCount}><Text style={s.colCountT}>{grouped[col.key].length}</Text></View>
              </View>
              <View style={s.colBody}>
                {grouped[col.key].length === 0 ? <View style={{ minHeight: 80 }} /> : grouped[col.key].map(t => (
                  <TaskCard key={t.id} task={t} assignee={t.assigned_to ? userMap[t.assigned_to] : null} onPress={() => router.push(`/task/${t.id}` as Href)} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {viewMode === 'list' && (
        <View style={{ gap: 12 }}>
          {filtered.length === 0 ? <Text style={s.empty}>No tasks match your filters.</Text> : filtered.map(t => (
            <TaskCard key={t.id} task={t} assignee={t.assigned_to ? userMap[t.assigned_to] : null} onPress={() => router.push(`/task/${t.id}` as Href)} />
          ))}
        </View>
      )}

      <SelectorModal visible={statusModal} title="Status" options={STATUS_OPTS} selectedValue={statusFilter} onSelect={v => setStatusFilter(v ?? 'all')} onClose={() => setStatusModal(false)} />
    </View>
    </FadeIn>
  )
}

const s = StyleSheet.create({
  root: { gap: 16 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  viewToggles: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(226,232,240,0.95)', backgroundColor: 'rgba(248,250,252,0.85)' },
  viewBtn: { padding: 8, borderRadius: 10 },
  viewBtnOn: { backgroundColor: palette.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 },
  statusTrigger: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(226,232,240,0.95)', backgroundColor: 'rgba(248,250,252,0.85)', flexGrow: 1, minWidth: 120 },
  statusText: { flex: 1, fontSize: 10, fontWeight: '900', letterSpacing: 1, color: palette.textMuted, textTransform: 'uppercase' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: palette.accent, shadowColor: palette.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 4 },
  newBtnT: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, color: '#fff' },
  board: { gap: 20 },
  colHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 20, marginBottom: 12 },
  colTitle: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1.2, textTransform: 'uppercase' },
  colCount: { minWidth: 26, height: 26, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  colCountT: { fontSize: 11, fontWeight: '800', color: '#fff' },
  colBody: { minHeight: 120, borderRadius: 28, backgroundColor: 'rgba(248,250,252,0.9)', padding: 14, gap: 12, borderWidth: 1, borderColor: 'rgba(226,232,240,0.6)' },
  taskCard: { borderRadius: 22, backgroundColor: palette.surface, borderWidth: 1, borderColor: 'rgba(226,232,240,0.9)', overflow: 'hidden', marginBottom: 4 },
  taskInner: { padding: 18, gap: 10 },
  taskTitle: { fontSize: 14, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 18 },
  taskDesc: { fontSize: 11, fontStyle: 'italic', color: palette.muted, fontWeight: '700', lineHeight: 16 },
  taskFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(248,250,252,0.9)' },
  priRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priDot: { width: 6, height: 6, borderRadius: 99 },
  priLabel: { fontSize: 8, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  footRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  duePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#f8fafc' },
  dueText: { fontSize: 9, fontWeight: '900', color: palette.muted, textTransform: 'uppercase' },
  avatarChip: { width: 28, height: 28, borderRadius: 10, backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 10, fontWeight: '900', color: palette.accent },
  empty: { textAlign: 'center', color: palette.muted, fontWeight: '600', marginTop: 24 },
})
