import { Ionicons } from '@expo/vector-icons'
import { type Href, useRouter, useNavigation } from 'expo-router'
import { DrawerActions } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { TaskOLogo } from '@/src/components/TaskOLogo'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

const ROWS: { label: string; path: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Search', path: '/search', icon: 'search-outline' },
  { label: 'Reports', path: '/reports', icon: 'bar-chart-outline' },
  { label: 'Invite', path: '/invite', icon: 'person-add-outline' },
  { label: 'Calendar', path: '/calendar', icon: 'calendar-outline' },
  { label: 'Kanban board', path: '/kanban', icon: 'clipboard-outline' },
  { label: 'Support', path: '/support', icon: 'help-buoy-outline' },
  { label: 'Help & resources', path: '/help', icon: 'book-outline' },
  { label: 'Settings & profile', path: '/settings', icon: 'settings-outline' },
]

export default function MoreScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [admin, setAdmin] = useState(false)

  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('is_platform_admin').eq('id', user.id).single()
      if (!cancel) setAdmin(!!data?.is_platform_admin)
    })()
    return () => { cancel = true }
  }, [])

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        onMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
        onNotification={() => router.push('/notifications')}
        onAddTask={() => setTaskModal(true)}
        onAddProject={() => setProjectModal(true)}
        onAddTeam={() => setTeamModal(true)}
        onAddMember={() => setMemberModal(true)}
      />
      <ScrollView contentContainerStyle={styles.content}>

      {ROWS.map(row => (
        <Pressable key={row.path} style={styles.row} onPress={() => router.push(row.path as never)}>
          <View style={styles.rowIcon}>
            <Ionicons name={row.icon} size={22} color={palette.primaryMid} />
          </View>
          <Text style={styles.rowLabel}>{row.label}</Text>
          <Ionicons name="chevron-forward" size={20} color={palette.muted} />
        </Pressable>
      ))}

      {admin ? (
        <Pressable style={[styles.row, styles.adminRow]} onPress={() => router.push('/admin-support' as Href)}>
          <View style={[styles.rowIcon, { backgroundColor: '#fef2f2' }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#dc2626" />
          </View>
          <Text style={styles.rowLabel}>Admin · Support queue</Text>
          <Ionicons name="chevron-forward" size={20} color={palette.muted} />
        </Pressable>
      ) : null}
      </ScrollView>

      <CreateTaskModal visible={taskModal} onClose={() => setTaskModal(false)} onCreateProject={() => setProjectModal(true)} />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} />
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreateProject={() => setProjectModal(true)} />
      <InviteMemberModal visible={memberModal} onClose={() => setMemberModal(false)} onCreateProject={() => setProjectModal(true)} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { paddingBottom: 120, paddingHorizontal: 16 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, marginTop: 8 },
  brandTitle: { fontSize: 22, fontWeight: '900', color: palette.text },
  brandSub: { fontSize: 12, color: palette.muted, fontWeight: '600', marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  adminRow: { borderColor: 'rgba(220,38,38,0.25)' },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: palette.text },
})
