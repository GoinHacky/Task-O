import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

import { FadeIn } from '@/src/components/FadeIn'
import { CardSkeleton } from '@/src/components/Skeleton'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type TeamRow = { id: string; name: string; tasks: { id: string; status: string }[] | null }

const RING_R = 16
const RING_C = 2 * Math.PI * RING_R
const INDIGO = '#6366f1'

function RingGauge({ pct }: { pct: number }) {
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * RING_C
  const gap = RING_C
  return (
    <View style={r.ringWrap}>
      <Svg width={192} height={192} viewBox="0 0 36 36" style={r.svgRot}>
        <Circle cx="18" cy="18" r={RING_R} stroke="#f1f5f9" strokeWidth={2.5} fill="transparent" />
        <Circle
          cx="18"
          cy="18"
          r={RING_R}
          stroke={INDIGO}
          strokeWidth={2.5}
          fill="transparent"
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
        />
      </Svg>
      <View style={r.ringCenter}>
        <Text style={r.ringPct}>{pct}%</Text>
        <Text style={r.ringLabel}>Aggregate Rate</Text>
      </View>
    </View>
  )
}

export function ReportsTab({ projectId }: { projectId: string }) {
  const [completionRate, setCompletionRate] = useState(0)
  const [teamVelocity, setTeamVelocity] = useState<{ name: string; velocity: number }[]>([])
  const [bottlenecks, setBottlenecks] = useState<{ name: string; score: number }[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [{ data: tasksAll }, { data: teamWorkload }] = await Promise.all([
      supabase.from('tasks').select('status').eq('project_id', projectId),
      supabase.from('teams').select('id, name, tasks(id, status)').eq('project_id', projectId),
    ])

    const list = (tasksAll || []) as { status: string }[]
    const total = list.length
    const completed = list.filter(t => t.status === 'completed').length
    setCompletionRate(total > 0 ? Math.round((completed / total) * 100) : 0)

    const teams = (teamWorkload || []) as TeamRow[]

    const vel = teams.map(team => {
      const teamTasks = team.tasks || []
      const teamTotal = teamTasks.length
      const teamDone = teamTasks.filter(t => t.status === 'completed').length
      const v = teamTotal > 0 ? Math.round((teamDone / teamTotal) * 100) : 0
      return { name: team.name, velocity: v }
    })
    setTeamVelocity(vel)

    const bn = teams
      .map(team => {
        const open = (team.tasks || []).filter(t => t.status !== 'completed').length
        return { name: team.name, score: open }
      })
      .sort((a, b) => b.score - a.score)
    setBottlenecks(bn)

    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const insight = useMemo(() => {
    if (completionRate >= 60) return { word: 'Upward', sub: 'Strong completion momentum this period.' }
    if (completionRate >= 40) return { word: 'Stable', sub: 'Progress is steady; keep clearing blockers.' }
    return { word: 'Cautious', sub: 'Focus on clearing pending and in-progress work.' }
  }, [completionRate])

  const onDateRange = () => {
    Alert.alert('Date range', 'Last 30 days view matches the web Insights header. Full date filtering can be added later.')
  }

  if (loading) return <CardSkeleton />

  return (
    <FadeIn>
      <View style={s.root}>
        <View style={s.headerBlock}>
          <Text style={s.kicker}>Insights & Intelligence</Text>
          <View style={s.hairline} />
          <View style={s.headerActions}>
            <Pressable style={s.rangeBtn} onPress={onDateRange}>
              <Text style={s.rangeBtnText}>Date Range: Last 30 Days</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.grid2}>
          <View style={s.cardHero}>
            <View style={s.zapGhost}>
              <Ionicons name="flash-outline" size={24} color="rgba(99,102,241,0.2)" />
            </View>
            <RingGauge pct={completionRate} />
            <Text style={s.heroTitle}>Velocity Baseline</Text>
            <Text style={s.heroSub}>Answering: Are we improving?</Text>
          </View>

          <View style={s.cardPanel}>
            <Text style={s.panelTitle}>Velocity by Team</Text>
            <View style={s.teamList}>
              {teamVelocity.length === 0 ? (
                <Text style={s.emptyHint}>Create teams and assign tasks to see per-team efficiency.</Text>
              ) : (
                teamVelocity.map((t, i) => (
                  <View key={`${t.name}-${i}`} style={s.teamBlock}>
                    <View style={s.teamRow}>
                      <Text style={s.teamName}>{t.name}</Text>
                      <Text style={s.teamEff}>{t.velocity}% Efficient</Text>
                    </View>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${t.velocity}%` }]} />
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        <View style={s.gridBottleneck}>
          <View style={s.bottleneckMain}>
            <View style={s.bottleneckHead}>
              <View style={s.targetIcon}>
                <Ionicons name="locate-outline" size={20} color="#f97316" />
              </View>
              <Text style={s.bottleneckTitle}>Bottleneck Analysis</Text>
            </View>
            <View style={s.bottleneckGrid}>
              {bottlenecks.length === 0 ? (
                <Text style={s.emptyHint}>No team workload to analyze yet.</Text>
              ) : (
                bottlenecks.map((b, i) => (
                  <View key={`${b.name}-${i}`} style={s.bnCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.bnTeam}>{b.name}</Text>
                      <Text style={s.bnScore}>{b.score} Critical Items</Text>
                    </View>
                    <View style={[s.bnIcon, b.score > 5 ? s.bnIconBad : s.bnIconOk]}>
                      <Ionicons
                        name={b.score > 5 ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                        size={20}
                        color={b.score > 5 ? '#ef4444' : '#10b981'}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={s.callout}>
            <Ionicons name="bar-chart-outline" size={32} color={INDIGO} style={s.calloutChart} />
            <Text style={s.calloutKicker}>Performance Report</Text>
            <Text style={s.calloutBody}>
              Team efficiency is trending <Text style={s.calloutAccent}>{insight.word}</Text> this period.
            </Text>
            <View style={s.calloutRule} />
            <Text style={s.calloutFoot}>
              {completionRate}% aggregate completion{insight.sub ? ` — ${insight.sub}` : ''}
            </Text>
          </View>
        </View>
      </View>
    </FadeIn>
  )
}

const r = StyleSheet.create({
  ringWrap: { width: 192, height: 192, marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
  svgRot: { transform: [{ rotate: '-90deg' }] },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: 42, fontWeight: '900', color: palette.text, letterSpacing: -1 },
  ringLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
})

const s = StyleSheet.create({
  root: { gap: 28, paddingBottom: 8 },
  headerBlock: { gap: 8 },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  hairline: { height: 1, backgroundColor: 'rgba(241,245,249,0.9)', width: '100%' },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  rangeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  rangeBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  grid2: { gap: 16 },
  cardHero: {
    backgroundColor: palette.surface,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  zapGhost: { position: 'absolute', top: 16, right: 16 },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cardPanel: {
    backgroundColor: palette.surface,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 24,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  teamList: { gap: 22 },
  teamBlock: { gap: 8 },
  teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamName: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontStyle: 'italic',
    flex: 1,
  },
  teamEff: { fontSize: 10, fontWeight: '900', color: INDIGO, textTransform: 'uppercase', letterSpacing: 0.6 },
  barTrack: { height: 6, borderRadius: 99, backgroundColor: '#f8fafc', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: INDIGO, borderRadius: 99 },
  emptyHint: { fontSize: 12, fontWeight: '600', color: palette.muted, fontStyle: 'italic' },
  gridBottleneck: { gap: 16 },
  bottleneckMain: {
    backgroundColor: palette.surface,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 24,
  },
  bottleneckHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  targetIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(249,115,22,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottleneckTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  bottleneckGrid: { gap: 14 },
  bnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(241,245,249,0.9)',
    gap: 12,
  },
  bnTeam: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 4,
  },
  bnScore: {
    fontSize: 15,
    fontWeight: '900',
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: -0.2,
  },
  bnIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bnIconOk: { backgroundColor: '#ecfdf5' },
  bnIconBad: { backgroundColor: '#fef2f2' },
  callout: {
    backgroundColor: '#1e293b',
    borderRadius: 36,
    padding: 28,
    borderWidth: 1,
    borderColor: '#334155',
  },
  calloutChart: { marginBottom: 20 },
  calloutKicker: {
    fontSize: 14,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 14,
  },
  calloutBody: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  calloutAccent: { color: INDIGO },
  calloutRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 22, marginBottom: 14 },
  calloutFoot: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontStyle: 'italic',
    lineHeight: 16,
  },
})
