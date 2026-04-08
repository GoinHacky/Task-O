import { Ionicons } from '@expo/vector-icons'
import { type Href, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { FadeIn } from '@/src/components/FadeIn'
import { CardSkeleton } from '@/src/components/Skeleton'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type TeamRow = { id: string; name: string; description: string | null; owner_id: string | null }
type TeamMetrics = { members: number; density: number }

export function TeamsTab({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [canAdmin, setCanAdmin] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [metrics, setMetrics] = useState<Record<string, TeamMetrics>>({})

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: project } = await supabase.from('projects').select('owner_id').eq('id', projectId).single()
    const { data: mem } = await supabase.from('project_members').select('role').eq('project_id', projectId).eq('user_id', user?.id || '').maybeSingle()
    const isOwner = project && user && (project as { owner_id: string }).owner_id === user.id
    setCanAdmin(!!isOwner || ['admin', 'owner'].includes((mem as { role: string } | null)?.role || ''))
    const { data } = await supabase
      .from('teams')
      .select('id, name, description, owner_id')
      .eq('project_id', projectId)
    const teamRows = (data || []) as TeamRow[]
    setTeams(teamRows)

    const { data: taskRows } = await supabase
      .from('tasks')
      .select('team_id, status, assigned_to')
      .eq('project_id', projectId)
    const { data: teamMemberRows } = await supabase
      .from('team_members')
      .select('team_id, user_id')
      .in('team_id', teamRows.map(t => t.id))

    const nextMetrics: Record<string, TeamMetrics> = {}
    for (const t of teamRows) {
      const scoped = (taskRows || []).filter((row: any) => row.team_id === t.id)
      const memberIds = new Set(
        (teamMemberRows || [])
          .filter((row: any) => row.team_id === t.id)
          .map((row: any) => row.user_id)
          .filter((v: string | null) => Boolean(v))
      )
      if (t.owner_id) memberIds.add(t.owner_id)
      const completed = scoped.filter((row: any) => row.status === 'completed').length
      const density = scoped.length > 0 ? Math.round((completed / scoped.length) * 100) : 0
      nextMetrics[t.id] = { members: memberIds.size, density }
    }
    setMetrics(nextMetrics)
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  function removeTeam(teamId: string, teamName: string) {
    Alert.alert('Delete team', `Remove "${teamName}" from this project?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('teams').delete().eq('id', teamId)
          if (error) Alert.alert('Error', error.message)
          else load()
        },
      },
    ])
  }

  if (loading) return <CardSkeleton />

  return (
    <FadeIn>
    <View style={s.root}>
      <View style={s.sectionHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>Strategic Units</Text>
          <Text style={s.sectionSub}>Define specialized domains and responsibility centers</Text>
        </View>
        {canAdmin ? (
          <Pressable style={s.createPill} onPress={() => setTeamModal(true)}>
            <View style={s.createIconWrap}>
              <Ionicons name="people-outline" size={16} color={palette.accent} />
            </View>
            <Text style={s.createPillText}>Create Team</Text>
          </Pressable>
        ) : null}
      </View>

      {teams.map(t => {
        const m = metrics[t.id] || { members: 0, density: 0 }
        return (
          <View key={t.id} style={s.teamCard}>
            <Pressable style={s.teamTop} onPress={() => router.push(`/project/${projectId}/team/${t.id}` as Href)}>
              <View style={s.teamIcon}>
                <Ionicons name="people-outline" size={18} color={palette.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.teamName}>{t.name}</Text>
                <Text style={s.teamDesc} numberOfLines={2}>
                  {(t.description || 'No description').toUpperCase()}
                </Text>
              </View>
            </Pressable>

            <View style={s.statsRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.statLabel}>Personnel</Text>
                <Text style={s.statValue}>{m.members} Core Staff</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.densityTop}>
                  <Text style={s.statLabel}>Execution Density</Text>
                  <Text style={s.densityPct}>{m.density}%</Text>
                </View>
                <View style={s.densityBarBg}>
                  <View style={[s.densityBarFill, { width: `${m.density}%` }]} />
                </View>
              </View>
            </View>

            <View style={s.actionsRow}>
              <Pressable
                style={s.reviewBtn}
                onPress={() => router.push(`/project/${projectId}/team/${t.id}` as Href)}
              >
                <Text style={s.reviewBtnText}>Review Unit</Text>
              </Pressable>
              {canAdmin ? (
                <Pressable style={s.deleteBtn} onPress={() => removeTeam(t.id, t.name)}>
                  <Ionicons name="trash-outline" size={15} color="#e11d48" />
                </Pressable>
              ) : null}
            </View>
          </View>
        )
      })}
      {teams.length === 0 ? <Text style={s.empty}>No teams yet.</Text> : null}
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreated={load} />
    </View>
    </FadeIn>
  )
}

const s = StyleSheet.create({
  root: { gap: 12 },
  sectionHead: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: -0.2,
  },
  sectionSub: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontStyle: 'italic',
  },
  createPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.8)',
    backgroundColor: palette.surface,
  },
  createIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(99,102,241,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPillText: { fontSize: 10, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: 0.8 },
  teamCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.65)',
    backgroundColor: palette.surface,
    padding: 14,
    gap: 12,
  },
  teamTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  teamIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbfdff',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: -0.1,
  },
  teamDesc: { fontSize: 10, color: palette.muted, marginTop: 4, fontWeight: '800', letterSpacing: 0.8 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statLabel: { fontSize: 9, fontWeight: '900', color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.9 },
  statValue: { marginTop: 4, fontSize: 11, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: 0.4 },
  densityTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  densityPct: { fontSize: 10, fontWeight: '900', color: palette.text, fontStyle: 'italic' },
  densityBarBg: {
    marginTop: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#eef2f7',
    overflow: 'hidden',
  },
  densityBarFill: { height: '100%', borderRadius: 999, backgroundColor: palette.accent },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  reviewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(203,213,225,0.8)',
  },
  reviewBtnText: { fontSize: 10, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: 0.9 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.35)',
    backgroundColor: 'rgba(255,241,242,0.9)',
  },
  empty: { textAlign: 'center', color: palette.muted, marginTop: 20, fontWeight: '600' },
})
