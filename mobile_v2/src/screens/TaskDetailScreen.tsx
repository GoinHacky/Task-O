import { Ionicons } from '@expo/vector-icons'
import { format, parseISO } from 'date-fns'
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

import { FadeIn } from '@/src/components/FadeIn'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { ScreenSkeleton } from '@/src/components/Skeleton'
import { EditTaskModal } from '@/src/components/EditTaskModal'
import { UserAvatar } from '@/src/components/UserAvatar'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'
import type { TaskItem } from '@/src/types'

type CommentRow = {
  id: string
  content: string
  created_at: string
  user_id: string
  user?: { full_name: string | null; avatar_url: string | null } | null
}

type ActivityRow = {
  id: string
  message: string
  created_at: string
  user?: { full_name: string | null; avatar_url: string | null } | null
  category: 'log' | 'comment'
}

function getStatusLabel(s: string) {
  switch (s) {
    case 'pending': return 'To Do'
    case 'in_progress': return 'Doing'
    case 'review': return 'Review'
    case 'completed': return 'Done'
    default: return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }
}

function getStatusDotColor(s: string) {
  switch (s) {
    case 'completed': return '#10b981'
    case 'in_progress': return '#f59e0b'
    case 'review': return '#6366f1'
    default: return '#38bdf8'
  }
}

function getPriorityFlagColor(p: string | null | undefined) {
  if (p === 'high') return '#f43f5e'
  if (p === 'medium') return '#f59e0b'
  return '#818cf8'
}

function formatLabel(label: string) {
  if (!label) return ''
  return label.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [task, setTask] = useState<TaskItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigneeName, setAssigneeName] = useState<string | null>(null)
  const [assigneeAvatar, setAssigneeAvatar] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string | null>(null)
  const [teamName, setTeamName] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [sending, setSending] = useState(false)
  const [editVisible, setEditVisible] = useState(false)

  const [activeTab, setActiveTab] = useState<'comments' | 'logs'>('comments')
  const [comments, setComments] = useState<CommentRow[]>([])
  const [activities, setActivities] = useState<any[]>([])

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return }

    const { data: t } = await supabase.from('tasks').select('*').eq('id', id).single()
    const taskData = (t as TaskItem) || null
    setTask(taskData)

    if (taskData) {
      if (taskData.assigned_to) {
        const { data: u } = await supabase.from('users').select('full_name, avatar_url').eq('id', taskData.assigned_to).single()
        setAssigneeName((u as any)?.full_name || null)
        setAssigneeAvatar((u as any)?.avatar_url || null)
      }
      if (taskData.project_id) {
        const { data: p } = await supabase.from('projects').select('name').eq('id', taskData.project_id).single()
        setProjectName((p as any)?.name || null)
      }
      if ((taskData as any).team_id) {
        const { data: tm } = await supabase.from('teams').select('name').eq('id', (taskData as any).team_id).single()
        setTeamName((tm as any)?.name || null)
      }
    }

    const { data: c } = await supabase
      .from('comments')
      .select('*, user:user_id(full_name, avatar_url)')
      .eq('task_id', id)
      .order('created_at', { ascending: true })
    setComments((c || []) as CommentRow[])

    const { data: a } = await supabase
      .from('activities')
      .select('*, user:user_id(full_name, avatar_url)')
      .eq('task_id', id)
      .order('created_at', { ascending: false })
    setActivities(a || [])

    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const combinedActivity: ActivityRow[] = [
    ...activities.map((a: any) => ({ ...a, category: 'log' as const })),
    ...comments.map(c => ({
      id: c.id,
      message: c.content,
      created_at: c.created_at,
      user: c.user,
      category: 'comment' as const,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filteredActivity = combinedActivity.filter(a =>
    activeTab === 'comments' ? a.category === 'comment' : a.category === 'log'
  )

  async function updateStatus(status: string) {
    if (!id) return
    const { error } = await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) Alert.alert('Update failed', error.message)
    else load()
  }

  async function sendComment() {
    if (!commentText.trim() || sending) return
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !id) { setSending(false); return }
    const { error } = await supabase.from('comments').insert({
      task_id: id,
      user_id: user.id,
      content: commentText.trim(),
    })
    setSending(false)
    if (error) Alert.alert('Comment failed', error.message)
    else { setCommentText(''); load() }
  }

  async function handleDelete() {
    if (!id) return
    Alert.alert('Delete Task', 'Are you sure? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setDeleting(true)
          await supabase.from('comments').delete().eq('task_id', id)
          const { error } = await supabase.from('tasks').delete().eq('id', id)
          setDeleting(false)
          if (error) Alert.alert('Delete failed', error.message)
          else router.back()
        },
      },
    ])
  }

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        onBack={() => router.back()}
        showNotification={false}
        right={<Text style={s.headerRightTitle}>Task Details</Text>}
      />

      {loading || !task ? (
        <ScreenSkeleton />
      ) : (
        <FadeIn style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={insets.top + 56}
          >
            <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
              {/* ─── Task Description ─── */}
              <View style={s.section}>
                <View style={s.labelRow}>
                  <Ionicons name="document-text-outline" size={12} color="#9ca3af" />
                  <Text style={s.label}>Task Description</Text>
                </View>
                <View style={s.descBox}>
                  <Text style={s.descText}>
                    {task.description || 'No task description provided.'}
                  </Text>
                </View>
              </View>

              {/* ─── Row: Team / Assignee ─── */}
              <View style={s.gridRow}>
                <View style={s.gridHalf}>
                  <Text style={s.label}>Team</Text>
                  <View style={s.fieldBox}>
                    <Text style={s.fieldText}>{formatLabel(teamName || 'No Team')}</Text>
                  </View>
                </View>
                <View style={s.gridHalf}>
                  <Text style={s.label}>Assignee</Text>
                  <View style={s.fieldBox}>
                    <UserAvatar
                      uri={assigneeAvatar}
                      name={assigneeName || 'U'}
                      size={20}
                      style={{ borderRadius: 6 }}
                    />
                    <Text style={s.fieldText} numberOfLines={1}>
                      {assigneeName || 'Unassigned'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ─── Row: Status / Priority ─── */}
              <View style={s.gridRow}>
                <View style={s.gridHalf}>
                  <Text style={s.label}>Status</Text>
                  <View style={s.fieldBox}>
                    <Text style={[s.fieldText, { flex: 1, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 10 }]}>
                      {getStatusLabel(task.status)}
                    </Text>
                    <View style={[s.statusDot, { backgroundColor: getStatusDotColor(task.status) }]} />
                  </View>
                </View>
                <View style={s.gridHalf}>
                  <Text style={s.label}>Priority</Text>
                  <View style={s.fieldBox}>
                    <Text style={[s.fieldText, { flex: 1, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 10 }]}>
                      {formatLabel(task.priority || 'Normal')}
                    </Text>
                    <Ionicons name="flag" size={12} color={getPriorityFlagColor(task.priority)} />
                  </View>
                </View>
              </View>

              {/* ─── Row: Due Date / Reference ID ─── */}
              <View style={s.gridRow}>
                <View style={s.gridHalf}>
                  <Text style={s.label}>Due Date</Text>
                  <View style={s.fieldBox}>
                    <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                    <Text style={s.fieldText}>
                      {task.due_date ? format(parseISO(task.due_date), 'MMMM dd, yyyy') : 'No Date Set'}
                    </Text>
                  </View>
                </View>
                <View style={s.gridHalf}>
                  <Text style={s.label}>Reference ID</Text>
                  <View style={s.fieldBox}>
                    <Text style={s.refHash}>#</Text>
                    <Text style={[s.fieldText, { color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 10 }]}>
                      {id ? id.slice(0, 8) : '—'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ─── Tabs: Comments / Status Logs ─── */}
              <View style={s.tabRow}>
                {(['comments', 'logs'] as const).map(tab => {
                  const active = activeTab === tab
                  return (
                    <Pressable
                      key={tab}
                      onPress={() => setActiveTab(tab)}
                      style={[s.tabBtn, active && s.tabBtnActive]}
                    >
                      <Text style={[s.tabBtnText, active && s.tabBtnTextActive]}>
                        {tab === 'comments' ? 'Comments' : 'Status Logs'}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* ─── Activity list ─── */}
              {filteredActivity.length === 0 ? (
                <View style={s.emptyActivity}>
                  <Ionicons
                    name={activeTab === 'comments' ? 'chatbubble-ellipses-outline' : 'time-outline'}
                    size={24}
                    color="#e2e8f0"
                  />
                  <Text style={s.emptyActivityText}>
                    {activeTab === 'comments' ? 'No comments yet.' : 'No status logs yet.'}
                  </Text>
                </View>
              ) : (
                <View style={s.activityList}>
                  {filteredActivity.map((a, idx) => (
                    <View key={a.id || idx} style={s.activityRow}>
                      <View style={s.activityLeft}>
                        <View style={s.activityAvatarWrap}>
                          <UserAvatar
                            uri={a.user?.avatar_url}
                            name={a.user?.full_name || 'U'}
                            size={30}
                            style={{ borderRadius: 10 }}
                          />
                        </View>
                        {idx < filteredActivity.length - 1 && <View style={s.activityLine} />}
                      </View>
                      <View style={s.activityRight}>
                        <View style={s.activityHead}>
                          <Text style={s.activityName}>{a.user?.full_name || 'Unknown'}</Text>
                          <Text style={s.activityDate}>
                            {format(parseISO(a.created_at), 'MMM dd')}
                          </Text>
                        </View>
                        <Text style={s.activityMsg}>{a.message}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* ─── Comment input ─── */}
              <View style={s.commentBox}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Write a comment..."
                  placeholderTextColor="#9ca3af"
                  style={s.commentInput}
                  multiline
                />
                <View style={s.commentFooter}>
                  <View style={{ flex: 1 }} />
                  <Pressable
                    onPress={sendComment}
                    disabled={!commentText.trim() || sending}
                    style={[s.sendBtn, (!commentText.trim() || sending) && s.sendBtnDisabled]}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 1 }} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* ─── Admin Actions: Edit / Delete ─── */}
              <View style={s.actionRow}>
                <Pressable
                  style={s.editBtn}
                  onPress={() => setEditVisible(true)}
                >
                  <Ionicons name="pencil" size={14} color="#fff" />
                  <Text style={s.actionBtnText}>Edit Task</Text>
                </Pressable>
                <Pressable
                  style={s.deleteBtn}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="trash" size={14} color="#fff" />
                      <Text style={s.actionBtnText}>Delete Task</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* ─── Bottom Workflow Bar ─── */}
              <WorkflowBar status={task.status} onUpdate={updateStatus} />
            </ScrollView>
          </KeyboardAvoidingView>
        </FadeIn>
      )}

      {id && (
        <EditTaskModal
          visible={editVisible}
          taskId={String(id)}
          onClose={() => setEditVisible(false)}
          onUpdated={load}
        />
      )}
    </View>
  )
}

function WorkflowBar({ status, onUpdate }: { status: string; onUpdate: (s: string) => void }) {
  if (status === 'pending' || status === 'todo') {
    return (
      <View style={s.workflowRow}>
        <Pressable style={s.wfAmber} onPress={() => onUpdate('in_progress')}>
          <Ionicons name="radio-button-on-outline" size={14} color="#fff" />
          <Text style={s.wfText}>Start Doing</Text>
        </Pressable>
        <Pressable style={s.wfIndigo} onPress={() => onUpdate('review')}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
          <Text style={s.wfText}>Submit for Review</Text>
        </Pressable>
      </View>
    )
  }
  if (status === 'in_progress') {
    return (
      <View style={s.workflowRow}>
        <Pressable style={s.wfGray} onPress={() => onUpdate('pending')}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={[s.wfText, { color: '#6b7280' }]}>Revert to Todo</Text>
        </Pressable>
        <Pressable style={s.wfIndigo} onPress={() => onUpdate('review')}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
          <Text style={s.wfText}>Submit for Review</Text>
        </Pressable>
      </View>
    )
  }
  if (status === 'review') {
    return (
      <View style={s.workflowRow}>
        <Pressable style={s.wfRose} onPress={() => onUpdate('in_progress')}>
          <Ionicons name="close" size={14} color="#fff" />
          <Text style={s.wfText}>Reject Task</Text>
        </Pressable>
        <Pressable style={s.wfEmerald} onPress={() => onUpdate('completed')}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
          <Text style={s.wfText}>Approve & Done</Text>
        </Pressable>
      </View>
    )
  }
  if (status === 'completed') {
    return (
      <View style={s.workflowRow}>
        <Pressable style={[s.wfAmber, { flex: 1 }]} onPress={() => onUpdate('in_progress')}>
          <Ionicons name="time-outline" size={14} color="#fff" />
          <Text style={s.wfText}>Reopen Task (In Progress)</Text>
        </Pressable>
      </View>
    )
  }
  return null
}

const FIELD_BG = 'rgba(249,250,251,0.5)'
const FIELD_BORDER = 'rgba(243,244,246,1)'

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  headerRightTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  body: { padding: 20, paddingBottom: 60 },

  section: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginLeft: 2 },
  label: { fontSize: 10, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginLeft: 2 },

  descBox: {
    padding: 18,
    backgroundColor: 'rgba(249,250,251,0.5)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(249,250,251,1)',
  },
  descText: { fontSize: 13, fontWeight: '500', color: '#374151', lineHeight: 20 },

  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  gridHalf: { flex: 1 },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: FIELD_BG,
    borderWidth: 1,
    borderColor: FIELD_BORDER,
    borderRadius: 16,
  },
  fieldText: { fontSize: 11, fontWeight: '800', color: '#111827' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  refHash: { fontSize: 12, fontWeight: '900', color: '#9ca3af' },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: FIELD_BORDER,
    marginBottom: 18,
    marginTop: 6,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(249,250,251,1)',
  },
  tabBtnActive: {
    backgroundColor: palette.accent,
    shadowColor: palette.accent,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  tabBtnText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#6b7280' },
  tabBtnTextActive: { color: '#fff' },

  emptyActivity: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.border,
    marginBottom: 18,
  },
  emptyActivityText: { fontSize: 12, color: palette.muted, fontWeight: '600' },

  activityList: { marginBottom: 18 },
  activityRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  activityLeft: { alignItems: 'center', width: 30 },
  activityAvatarWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FIELD_BORDER,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  activityLine: { flex: 1, width: 1, backgroundColor: 'rgba(249,250,251,1)', marginTop: 4 },
  activityRight: { flex: 1, paddingBottom: 16 },
  activityHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  activityName: { fontSize: 11, fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: 0.3 },
  activityDate: { fontSize: 9, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.5 },
  activityMsg: { fontSize: 11, fontWeight: '500', color: '#4b5563', lineHeight: 17 },

  commentBox: {
    padding: 4,
    backgroundColor: 'rgba(249,250,251,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,1)',
    borderRadius: 24,
    marginBottom: 24,
  },
  commentInput: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    fontSize: 13,
    color: '#374151',
    minHeight: 60,
    maxHeight: 140,
    textAlignVertical: 'top',
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.accent,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: '#e5e7eb', shadowOpacity: 0 },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(249,250,251,1)',
    marginBottom: 14,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: palette.accent,
    borderRadius: 14,
    shadowColor: palette.accent,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    shadowColor: '#ef4444',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },

  workflowRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(249,250,251,1)',
  },
  wfAmber: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#f59e0b',
    borderRadius: 14,
    shadowColor: '#f59e0b',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  wfIndigo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: palette.accent,
    borderRadius: 14,
    shadowColor: palette.accent,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  wfGray: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
  },
  wfRose: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#f43f5e',
    borderRadius: 14,
    shadowColor: '#f43f5e',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  wfEmerald: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#10b981',
    borderRadius: 14,
    shadowColor: '#10b981',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  wfText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
})
