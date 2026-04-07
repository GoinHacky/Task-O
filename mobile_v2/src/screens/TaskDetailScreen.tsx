import { Ionicons } from '@expo/vector-icons'
import { type Href, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '@/src/lib/supabase'
import { TaskItem } from '@/src/types'
import { palette } from '@/src/theme'

type CommentRow = {
  id: string
  content: string
  created_at: string
  user_id: string
}

const STATUSES: TaskItem['status'][] = ['pending', 'in_progress', 'review', 'completed']

function getPriorityColor(priority: string | null | undefined) {
  switch (priority) {
    case 'high':
      return { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444', label: 'High' }
    case 'medium':
      return { bg: '#fffbeb', text: '#d97706', dot: '#f59e0b', label: 'Medium' }
    case 'low':
      return { bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e', label: 'Low' }
    default:
      return { bg: '#f1f5f9', text: palette.muted, dot: '#94a3b8', label: 'None' }
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return { bg: '#f0fdf4', text: '#16a34a' }
    case 'in_progress':
      return { bg: '#eff6ff', text: '#3b82f6' }
    case 'review':
      return { bg: '#faf5ff', text: '#8b5cf6' }
    default:
      return { bg: '#f8fafc', text: '#64748b' }
  }
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [task, setTask] = useState<TaskItem | null>(null)
  const [assigneeName, setAssigneeName] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    const { data: t } = await supabase.from('tasks').select('*').eq('id', id).single()
    setTask((t as TaskItem) || null)

    if (t) {
      const taskData = t as TaskItem
      // Fetch assignee name
      if (taskData.assigned_to) {
        const { data: u } = await supabase.from('users').select('full_name').eq('id', taskData.assigned_to).single()
        setAssigneeName((u as any)?.full_name || null)
      }
      // Fetch project name
      if (taskData.project_id) {
        const { data: p } = await supabase.from('projects').select('name').eq('id', taskData.project_id).single()
        setProjectName((p as any)?.name || null)
      }
    }

    const { data: c } = await supabase.from('comments').select('*').eq('task_id', id).order('created_at', { ascending: true })
    setComments((c || []) as CommentRow[])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(status: TaskItem['status']) {
    if (!id) return
    const { error } = await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) Alert.alert('Update failed', error.message)
    else load()
  }

  async function sendComment() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !id || !commentText.trim()) return
    const { error } = await supabase.from('comments').insert({
      task_id: id,
      user_id: user.id,
      content: commentText.trim(),
    })
    if (error) Alert.alert('Comment failed', error.message)
    else {
      setCommentText('')
      load()
    }
  }

  async function handleDelete() {
    if (!id) return
    Alert.alert(
      'Delete Task',
      'Are you sure you want to permanently delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            // Delete comments first
            await supabase.from('comments').delete().eq('task_id', id)
            const { error } = await supabase.from('tasks').delete().eq('id', id)
            setDeleting(false)
            if (error) Alert.alert('Delete failed', error.message)
            else router.back()
          },
        },
      ],
    )
  }

  if (loading || !task) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  const prioColor = getPriorityColor(task.priority)
  const statusColor = getStatusColor(task.status)

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Task
        </Text>
        <View style={styles.topActions}>
          <Pressable onPress={() => router.push(`/task/${id}/edit` as Href)} hitSlop={12} style={styles.topActionBtn}>
            <Ionicons name="create-outline" size={20} color={palette.primaryMid} />
          </Pressable>
          <Pressable onPress={handleDelete} hitSlop={12} style={styles.topActionBtn} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
            )}
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {/* Title */}
        <Text style={styles.title}>{task.title}</Text>

        {/* Priority & Status badges row */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: prioColor.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: prioColor.dot }]} />
            <Text style={[styles.badgeText, { color: prioColor.text }]}>
              {prioColor.label} Priority
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.badgeText, { color: statusColor.text }]}>
              {task.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descCard}>
          <Text style={styles.descLabel}>Description</Text>
          <Text style={styles.desc}>{task.description || 'No description provided.'}</Text>
        </View>

        {/* Meta info */}
        <View style={styles.metaCard}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={palette.muted} />
            <Text style={styles.metaLabel}>Due</Text>
            <Text style={styles.metaValue}>
              {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
            </Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={16} color={palette.muted} />
            <Text style={styles.metaLabel}>Assignee</Text>
            <Text style={styles.metaValue}>{assigneeName || 'Unassigned'}</Text>
          </View>
          {projectName && (
            <>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Ionicons name="folder-outline" size={16} color={palette.muted} />
                <Text style={styles.metaLabel}>Project</Text>
                <Text style={styles.metaValue}>{projectName}</Text>
              </View>
            </>
          )}
        </View>

        {/* Status selector */}
        <Text style={styles.section}>Update Status</Text>
        <View style={styles.statusRow}>
          {STATUSES.map(s => {
            const sc = getStatusColor(s)
            const active = task.status === s
            return (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={[
                  styles.statusChip,
                  active && { borderColor: sc.text, backgroundColor: sc.bg },
                ]}
              >
                {active && <View style={[styles.statusDot, { backgroundColor: sc.text }]} />}
                <Text
                  style={[
                    styles.statusChipText,
                    active && { color: sc.text, fontWeight: '800' },
                  ]}
                >
                  {s.replace('_', ' ')}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Comments */}
        <Text style={styles.section}>
          Comments {comments.length > 0 ? `(${comments.length})` : ''}
        </Text>
        {comments.length === 0 ? (
          <View style={styles.emptyComments}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#e2e8f0" />
            <Text style={styles.emptyCommentText}>No comments yet. Start the conversation!</Text>
          </View>
        ) : (
          comments.map(c => (
            <View key={c.id} style={styles.comment}>
              <Text style={styles.commentBody}>{c.content}</Text>
              <Text style={styles.commentTime}>{new Date(c.created_at).toLocaleString()}</Text>
            </View>
          ))
        )}
        <View style={styles.commentInputRow}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write a comment..."
            placeholderTextColor="#94a3b8"
            style={styles.input}
            multiline
          />
        </View>
        <Pressable style={styles.sendBtn} onPress={sendComment}>
          <Ionicons name="send-outline" size={16} color="#fff" />
          <Text style={styles.sendBtnText}>Post comment</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.surface,
  },
  back: { padding: 6 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: palette.text },
  topActions: { flexDirection: 'row', gap: 4 },
  topActionBtn: { padding: 6 },
  body: { padding: 16, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '900', color: palette.text, lineHeight: 28 },

  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },

  descCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    padding: 16,
  },
  descLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  desc: { fontSize: 14, color: palette.muted, lineHeight: 22, fontWeight: '500' },

  metaCard: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    padding: 14,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  metaLabel: { fontSize: 12, fontWeight: '700', color: palette.muted, minWidth: 60 },
  metaValue: { fontSize: 14, fontWeight: '700', color: palette.text, flex: 1 },
  metaDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 2 },

  section: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.muted,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { fontSize: 12, fontWeight: '700', color: palette.muted, textTransform: 'capitalize' },

  emptyComments: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.border,
  },
  emptyCommentText: { fontSize: 12, color: palette.muted, fontWeight: '600' },

  comment: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  commentBody: { fontSize: 14, color: palette.text, fontWeight: '600', lineHeight: 20 },
  commentTime: { fontSize: 11, color: palette.muted, marginTop: 6 },

  commentInputRow: { marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: palette.surface,
    color: palette.text,
    fontSize: 14,
  },
  sendBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.primaryMid,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: palette.primaryMid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
})
