import { Ionicons } from '@expo/vector-icons'
import { type Href, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { FadeIn } from '@/src/components/FadeIn'
import { ScreenSkeleton } from '@/src/components/Skeleton'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type ActivityRow = { id: string; type: string; message: string; created_at: string }
type TimelineTask = { id: string; title: string; status: string; updated_at: string }

function fmtWhen(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })} · ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

function actIcon(type: string): keyof typeof Ionicons.glyphMap {
  const t = type.toLowerCase()
  if (t.includes('comment') || t.includes('message')) return 'chatbubble-outline'
  if (t.includes('status') || t.includes('progress')) return 'arrow-forward-circle-outline'
  return 'pulse-outline'
}

type OverviewTabProps = {
  projectId: string
  onOpenMemberModal?: () => void
  onOpenTaskModal?: () => void
}

export function OverviewTab({ projectId, onOpenMemberModal, onOpenTaskModal }: OverviewTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, done: 0, doing: 0, pending: 0 })
  const [activities, setActivities] = useState<ActivityRow[]>([])
  const [tl, setTl] = useState<TimelineTask[]>([])

  const load = useCallback(async () => {
    const { data: taskRows } = await supabase.from('tasks').select('status').eq('project_id', projectId)
    const list = taskRows || []
    setStats({
      total: list.length,
      done: list.filter((t: any) => t.status === 'completed').length,
      doing: list.filter((t: any) => t.status === 'in_progress').length,
      pending: list.filter((t: any) => t.status === 'pending' || t.status === 'review').length,
    })
    const { data: act } = await supabase.from('activities').select('id, type, message, created_at').eq('project_id', projectId).order('created_at', { ascending: false }).limit(6)
    const { data: tline } = await supabase.from('tasks').select('id, title, status, updated_at').eq('project_id', projectId).order('updated_at', { ascending: false }).limit(4)
    setActivities((act || []) as ActivityRow[])
    setTl((tline || []) as TimelineTask[])
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const health = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
  const onTrack = stats.total === 0 || health >= 60
  const integrityColor = onTrack ? '#10b981' : '#f59e0b'
  const phaseLabel = useMemo(() => {
    if (stats.doing > 0) return 'Execution Active'
    if (stats.pending > 0) return 'Planning queue'
    if (stats.total > 0 && stats.done === stats.total) return 'Complete'
    return 'Kickoff'
  }, [stats])

  if (loading) return <ScreenSkeleton />

  return (
    <FadeIn>
    <View style={s.root}>
      <View style={s.integrityRow}>
        <View style={s.integrityLeft}>
          <Text style={s.micro}>Project integrity:</Text>
          <View style={s.pills}>
            <Text style={[s.intLabel, { color: integrityColor }]}>{onTrack ? 'On Track' : 'At Risk'}</Text>
            <View style={s.barBg}><View style={[s.barFill, { width: `${health}%`, backgroundColor: integrityColor }]} /></View>
            <Text style={s.intPct}>{health}%</Text>
          </View>
        </View>
        <View style={s.phaseBlock}>
          <Text style={s.micro}>Timeline phase:</Text>
          <View style={s.badge}><Text style={s.badgeT}>{phaseLabel}</Text></View>
        </View>
      </View>

      <View style={s.kpiGrid}>
        {([['Total Tasks', stats.total, palette.text], ['Resolved', stats.done, '#10b981'], ['Operating', stats.doing, '#f59e0b'], ['Queued', stats.pending, palette.accent]] as const).map(([k, v, c]) => (
          <View key={k} style={s.kpiCard}><Text style={s.kpiK}>{k}</Text><Text style={[s.kpiV, { color: c }]}>{v}</Text></View>
        ))}
      </View>

      <View style={s.panel}>
        <View style={s.panelH}><Ionicons name="time-outline" size={14} color={palette.accent} /><Text style={s.panelT}>Project timeline</Text></View>
        {tl.length === 0 ? <Text style={s.hint}>No tasks yet.</Text> : (
          <View style={s.timeline}>
            <View style={s.tlLine} />
            {tl.map(t => {
              const bg = t.status === 'completed' ? '#10b981' : t.status === 'in_progress' ? palette.accent : '#e2e8f0'
              const sub = (t.status === 'completed' ? 'Completed' : t.status === 'in_progress' ? 'Active' : 'Pending') + ` · ${fmtWhen(t.updated_at)}`
              return (
                <View key={t.id} style={s.tlRow}>
                  <View style={[s.tlDot, { backgroundColor: bg, borderColor: palette.surface }]} />
                  <View style={{ flex: 1 }}><Text style={s.tlTitle} numberOfLines={2}>{t.title}</Text><Text style={s.tlMeta}>{sub}</Text></View>
                </View>
              )
            })}
          </View>
        )}
      </View>

      <View style={s.panel}>
        <View style={s.panelHR}><View style={[s.panelH, { marginBottom: 0 }]}><Ionicons name="pulse-outline" size={14} color={palette.accent} /><Text style={s.panelT}>Recent activity</Text></View><Text style={s.live}>Live feed</Text></View>
        {activities.length === 0 ? <Text style={s.hint}>Activity will show up as your team works.</Text> : (
          <View style={{ gap: 20 }}>
            {activities.map(a => (
              <View key={a.id} style={s.actRow}>
                <View style={s.actIcon}><Ionicons name={actIcon(a.type)} size={14} color={palette.muted} /></View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={s.actTop}><Text style={s.actType} numberOfLines={1}>{a.type.replace(/_/g, ' ')}</Text><Text style={s.actWhen}>{fmtWhen(a.created_at)}</Text></View>
                  <Text style={s.actMsg} numberOfLines={3}>{a.message}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={s.panel}>
        <View style={s.panelH}><Ionicons name="flash-outline" size={14} color="#f59e0b" /><Text style={s.panelT}>Operational control</Text></View>
        <View style={{ gap: 12 }}>
          {([['person-add-outline', 'Add member', `/project/${projectId}/members`], ['add-circle-outline', 'New task', `/task/new?projectId=${projectId}`]] as const).map(([ic, label, path]) => (
            <Pressable
              key={label}
              style={s.opBtn}
              onPress={() => {
                if (label === 'Add member') {
                  onOpenMemberModal?.()
                  return
                }
                if (label === 'New task') {
                  onOpenTaskModal?.()
                  return
                }
                router.push(path as Href)
              }}
            >
              <Ionicons name={ic as keyof typeof Ionicons.glyphMap} size={18} color={palette.text} /><Text style={s.opBtnT}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
    </FadeIn>
  )
}

const s = StyleSheet.create({
  root: { gap: 20 },
  integrityRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(203,213,225,0.55)' },
  integrityLeft: { gap: 8, flex: 1, minWidth: 200 },
  micro: { fontSize: 10, fontWeight: '900', color: palette.muted, letterSpacing: 1, textTransform: 'uppercase' },
  pills: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  intLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  barBg: { width: 64, height: 4, borderRadius: 99, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },
  intPct: { fontSize: 10, fontWeight: '900', color: palette.muted, letterSpacing: 0.6 },
  phaseBlock: { gap: 8, alignItems: 'flex-start' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: 'rgba(203,213,225,0.8)' },
  badgeT: { fontSize: 10, fontWeight: '900', color: palette.text, letterSpacing: 1, textTransform: 'uppercase' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: { width: '47%', flexGrow: 1, padding: 18, borderRadius: 28, backgroundColor: palette.surface, borderWidth: 1, borderColor: 'rgba(203,213,225,0.75)' },
  kpiK: { fontSize: 10, fontWeight: '900', color: palette.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  kpiV: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  panel: { borderRadius: 28, borderWidth: 1, borderColor: 'rgba(203,213,225,0.75)', backgroundColor: palette.surface, padding: 20 },
  panelH: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  panelHR: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  panelT: { fontSize: 11, fontWeight: '900', color: palette.text, letterSpacing: 1.6, textTransform: 'uppercase' },
  live: { fontSize: 8, fontWeight: '900', fontStyle: 'italic', color: palette.muted, letterSpacing: 1, textTransform: 'uppercase' },
  hint: { fontSize: 13, fontWeight: '600', color: palette.muted },
  timeline: { position: 'relative', paddingLeft: 4, gap: 20 },
  tlLine: { position: 'absolute', left: 7, top: 6, bottom: 6, width: 1, backgroundColor: '#f1f5f9' },
  tlRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  tlDot: { width: 14, height: 14, borderRadius: 999, borderWidth: 3, marginTop: 2, zIndex: 1 },
  tlTitle: { fontSize: 12, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: 0.3 },
  tlMeta: { marginTop: 4, fontSize: 9, fontWeight: '700', color: palette.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  actRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  actIcon: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, borderColor: palette.border, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  actTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  actType: { flex: 1, fontSize: 11, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: 0.2 },
  actWhen: { fontSize: 8, fontWeight: '900', color: palette.muted, letterSpacing: 0.6 },
  actMsg: { fontSize: 13, fontWeight: '700', color: '#475569', lineHeight: 18 },
  opBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 18, backgroundColor: 'rgba(248,250,252,0.95)', borderWidth: 1, borderColor: 'rgba(226,232,240,0.9)' },
  opBtnT: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase', color: palette.text },
})
