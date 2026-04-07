import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { type Href, useRouter, useNavigation } from 'expo-router'
import { DrawerActions } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated'

import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { fetchProjectsForCurrentUser } from '@/src/lib/fetchUserProjects'
import { ProjectItem } from '@/src/types'
import { palette } from '@/src/theme'

const CARD_COLORS = [
  { bg: 'rgba(99,102,241,0.12)', icon: '#6366f1' }, // Indigo
  { bg: 'rgba(14,165,233,0.12)', icon: '#0ea5e9' }, // Sky
  { bg: 'rgba(16,185,129,0.12)', icon: '#10b981' }, // Emerald
  { bg: 'rgba(245,158,11,0.12)', icon: '#f59e0b' }, // Amber
  { bg: 'rgba(244,63,94,0.12)', icon: '#f43f5e' }, // Rose
  { bg: 'rgba(139,92,246,0.12)', icon: '#8b5cf6' }, // Violet
]

export default function ProjectsScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [projects, setProjects] = useState<(ProjectItem & { role?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showTaskCreate, setShowTaskCreate] = useState(false)
  const [showTeamCreate, setShowTeamCreate] = useState(false)
  const [showMemberInvite, setShowMemberInvite] = useState(false)

  const loadProjects = useCallback(async () => {
    const rows = await fetchProjectsForCurrentUser('created_desc')
    setProjects(rows as (ProjectItem & { role?: string })[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader
        onMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
        onNotification={() => router.push('/notifications')}
        onAddTask={() => setShowTaskCreate(true)}
        onAddProject={() => setShowCreate(true)}
        onAddTeam={() => setShowTeamCreate(true)}
        onAddMember={() => setShowMemberInvite(true)}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              await loadProjects()
              setRefreshing(false)
            }}
            tintColor={palette.primary}
          />
        }
      >

        {projects.length === 0 ? (
          <View style={styles.emptyView}>
            <Ionicons name="folder-open-outline" size={48} color="#e2e8f0" />
            <Text style={styles.emptyText}>No projects found</Text>
            <Text style={styles.emptySubText}>Start by creating a new collaborative workspace.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.emptyBtnText}>New Project</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.grid}>
            {projects.map((project, idx) => {
              const color = CARD_COLORS[idx % CARD_COLORS.length]
              const isAdmin = project.role === 'admin'
              const dateStr = project.created_at ? format(new Date(project.created_at), 'MMM dd, yyyy') : '—'

              return (
                <Animated.View 
                  key={project.id} 
                  entering={FadeInDown.delay(idx * 40)}
                  layout={LinearTransition}
                >
                  <Pressable
                    style={styles.card}
                    onPress={() => router.push(`/project/${project.id}` as Href)}
                  >
                    <View style={styles.cardTop}>
                      <View style={[styles.iconBox, { backgroundColor: color.bg }]}>
                        <Ionicons name="folder-open" size={20} color={color.icon} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{project.name}</Text>
                        <Text style={styles.cardDesc} numberOfLines={1}>{project.description || 'No description'}</Text>
                      </View>
                    </View>

                    <View style={styles.pillRow}>
                      <View style={[styles.pill, isAdmin ? styles.pillAdmin : styles.pillMember]}>
                        <Text style={[styles.pillText, isAdmin ? styles.pillTextAdmin : styles.pillTextMember]}>
                          {isAdmin ? 'Admin' : 'Member'}
                        </Text>
                      </View>
                      <View style={styles.pillNeutral}>
                        <Text style={styles.pillTextNeutral}>{project.status}</Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.footerInfo}>
                        <Ionicons name="time-outline" size={12} color={palette.muted} />
                        <Text style={styles.footerDate}>{dateStr}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                    </View>
                  </Pressable>
                </Animated.View>
              )
            })}
          </View>
        )}
      </ScrollView>

      <CreateProjectModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadProjects}
      />
      <CreateTaskModal visible={showTaskCreate} onClose={() => setShowTaskCreate(false)} onCreated={loadProjects} onCreateProject={() => setShowCreate(true)} />
      <CreateTeamModal visible={showTeamCreate} onClose={() => setShowTeamCreate(false)} onCreated={loadProjects} onCreateProject={() => setShowCreate(true)} />
      <InviteMemberModal visible={showMemberInvite} onClose={() => setShowMemberInvite(false)} onCreated={loadProjects} onCreateProject={() => setShowCreate(true)} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerK: { fontSize: 10, fontWeight: '900', color: palette.primary, textTransform: 'uppercase', letterSpacing: 2 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: palette.text, marginTop: 2, letterSpacing: -1 },

  createMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: palette.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  createMainText: { color: '#fff', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

  grid: { gap: 12 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.1)',
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '900', color: palette.text, letterSpacing: -0.5 },
  cardDesc: { fontSize: 13, color: palette.muted, marginTop: 2, fontWeight: '500' },

  pillRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  pillAdmin: { backgroundColor: 'rgba(139,92,246,0.1)' },
  pillMember: { backgroundColor: 'rgba(14,165,233,0.1)' },
  pillNeutral: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  pillText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  pillTextAdmin: { color: '#7c3aed' },
  pillTextMember: { color: '#0284c7' },
  pillTextNeutral: { color: palette.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerDate: { fontSize: 11, fontWeight: '700', color: palette.muted },

  emptyView: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 20, fontWeight: '900', color: palette.text },
  emptySubText: { textAlign: 'center', color: palette.muted, fontSize: 14, lineHeight: 20 },
  emptyBtn: { backgroundColor: palette.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
})
