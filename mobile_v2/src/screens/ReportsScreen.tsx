import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

export default function ReportsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [stats, setStats] = useState({
    totalTasks: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    totalProjects: 0,
    activeProjects: 0,
  })
  const [loading, setLoading] = useState(true)

  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data: tasks } = await supabase.from('tasks').select('status').eq('assigned_to', user.id)
    const { data: projects } = await supabase.from('projects').select('status').eq('owner_id', user.id)
    const t = tasks || []
    setStats({
      totalTasks: t.length,
      completed: t.filter(x => x.status === 'completed').length,
      inProgress: t.filter(x => x.status === 'in_progress').length,
      pending: t.filter(x => x.status === 'pending').length,
      totalProjects: (projects || []).length,
      activeProjects: (projects || []).filter(p => p.status === 'active').length,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  const boxes = [
    ['Total tasks', stats.totalTasks],
    ['Completed', stats.completed],
    ['In progress', stats.inProgress],
    ['Pending', stats.pending],
    ['Projects', stats.totalProjects],
    ['Active projects', stats.activeProjects],
  ] as const

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        onBack={() => router.back()}
        onNotification={() => router.push('/notifications')}
        onAddTask={() => setTaskModal(true)}
        onAddProject={() => setProjectModal(true)}
        onAddTeam={() => setTeamModal(true)}
        onAddMember={() => setMemberModal(true)}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.lead}>Insights for work assigned to you and projects you own.</Text>
        <View style={styles.grid}>
          {boxes.map(([k, v]) => (
            <View key={k} style={styles.box}>
              <Text style={styles.val}>{v}</Text>
              <Text style={styles.key}>{k}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <CreateTaskModal visible={taskModal} onClose={() => setTaskModal(false)} onCreated={load} onCreateProject={() => setProjectModal(true)} />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onCreated={load} />
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreated={load} onCreateProject={() => setProjectModal(true)} />
      <InviteMemberModal visible={memberModal} onClose={() => setMemberModal(false)} onCreated={load} onCreateProject={() => setProjectModal(true)} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  body: { padding: 16, paddingBottom: 40 },
  lead: { fontSize: 14, color: palette.muted, fontWeight: '600', marginBottom: 16, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  box: {
    width: '47%',
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  val: { fontSize: 26, fontWeight: '900', color: palette.text },
  key: { fontSize: 11, color: palette.muted, marginTop: 6, fontWeight: '700' },
})
