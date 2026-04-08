import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { type Href, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { FadeIn } from '@/src/components/FadeIn'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { DrawerScreenHeader } from '@/src/components/ScreenHeader'
import { CardSkeleton } from '@/src/components/Skeleton'
import { useSession } from '@/src/context/SessionContext'
import { fetchProjectsForCurrentUser } from '@/src/lib/fetchUserProjects'
import { ProjectItem } from '@/src/types'
import { palette } from '@/src/theme'

function formatProjectStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const CYAN_ICON_BOX = 'rgba(6,182,212,0.15)'
const CYAN_ICON = '#22d3ee'

export default function ProjectsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { session } = useSession()
  const userId = session?.user?.id ?? null

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

  const padH = width >= 1024 ? 32 : width >= 640 ? 16 : 12
  /** Grid width inside scroll (matches max content column) */
  const innerW = Math.min(1400, width - padH * 2)
  /** One column on phones — two narrow cards looked too small (see layout feedback). */
  const numCols = innerW >= 900 ? 3 : innerW >= 640 ? 2 : 1
  const cardGap = 14
  const cardW = numCols === 1 ? innerW : (innerW - cardGap * (numCols - 1)) / numCols

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <DrawerScreenHeader
        onAddTask={() => setShowTaskCreate(true)}
        onAddProject={() => setShowCreate(true)}
        onAddTeam={() => setShowTeamCreate(true)}
        onAddMember={() => setShowMemberInvite(true)}
      />
      {loading ? (
        <View style={[styles.outer, { paddingHorizontal: padH }]}>
          <CardSkeleton count={4} />
        </View>
      ) : (
      <FadeIn style={styles.fadeFlex}>
        <ScrollView
          contentContainerStyle={[styles.scrollOuter, { paddingHorizontal: padH, paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true)
                await loadProjects()
                setRefreshing(false)
              }}
              tintColor={palette.primaryMid}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.maxW}>
            <View style={styles.pageHeader}>
              <View style={styles.titleBlock}>
                <Text style={styles.h1}>Projects</Text>
                <Text style={styles.subtitle}>Manage and track all collaborative projects.</Text>
              </View>
              <Pressable style={styles.newProjectBtn} onPress={() => setShowCreate(true)}>
                <Ionicons name="add" size={17} color="#fff" />
                <Text style={styles.newProjectBtnText}>New Project</Text>
              </Pressable>
            </View>

            <View style={styles.pageBody}>
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
                  <View style={[styles.grid, { gap: cardGap, rowGap: cardGap }]}>
                    {projects.map(project => {
                      const isAdmin = project.role === 'admin'
                      const isOwner = !!userId && project.owner_id === userId
                      const statusLabel = formatProjectStatus(project.status || 'active')
                      const dateStr = project.created_at
                        ? format(new Date(project.created_at), 'MMM dd')
                        : '—'

                      return (
                        <Pressable
                          key={project.id}
                          style={[styles.card, { width: cardW }]}
                          onPress={() => router.push(`/project/${project.id}` as Href)}
                        >
                          <View style={styles.cardTop}>
                            <View style={styles.iconBox}>
                              <Ionicons name="albums-outline" size={22} color={CYAN_ICON} />
                            </View>
                            <View style={styles.cardTitles}>
                              <Text style={styles.cardTitle} numberOfLines={1}>
                                {project.name}
                              </Text>
                              <Text style={styles.cardDesc} numberOfLines={1}>
                                {project.description?.trim() || 'No description'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.pillRow}>
                            <View style={styles.pillAdmin}>
                              <View style={styles.pillDot} />
                              <Text style={styles.pillAdminText}>{isAdmin ? 'Admin' : 'Member'}</Text>
                            </View>
                            <View style={styles.pillSlate}>
                              <Ionicons name="grid-outline" size={11} color="#64748b" />
                              <Text style={styles.pillSlateText}>{statusLabel}</Text>
                            </View>
                            {isOwner ? (
                              <View style={styles.pillOwner}>
                                <Text style={styles.pillOwnerText}>Owner</Text>
                              </View>
                            ) : null}
                          </View>

                          <View>
                            <View style={styles.cardRule} />
                            <View style={styles.cardFooter}>
                              <View style={styles.footerMeta}>
                                <View style={styles.footerItem}>
                                  <Ionicons name="time-outline" size={12} color="#94a3b8" />
                                  <Text style={styles.footerSmall}>{dateStr}</Text>
                                </View>
                                <View style={styles.footerItem}>
                                  <Ionicons name="grid-outline" size={12} color="#94a3b8" />
                                  <Text style={styles.footerSmall}>{statusLabel}</Text>
                                </View>
                              </View>
                              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                            </View>
                          </View>
                        </Pressable>
                      )
                    })}
                  </View>
                )}
            </View>
          </View>
        </ScrollView>
      </FadeIn>
      )}

      <CreateProjectModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={loadProjects} />
      <CreateTaskModal
        visible={showTaskCreate}
        onClose={() => setShowTaskCreate(false)}
        onCreated={loadProjects}
        onCreateProject={() => setShowCreate(true)}
      />
      <CreateTeamModal
        visible={showTeamCreate}
        onClose={() => setShowTeamCreate(false)}
        onCreated={loadProjects}
        onCreateProject={() => setShowCreate(true)}
      />
      <InviteMemberModal
        visible={showMemberInvite}
        onClose={() => setShowMemberInvite(false)}
        onCreated={loadProjects}
        onCreateProject={() => setShowCreate(true)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  fadeFlex: { flex: 1 },
  outer: { flex: 1, paddingTop: 8 },
  scrollOuter: { flexGrow: 1, paddingTop: 8 },
  maxW: { maxWidth: 1400, width: '100%', alignSelf: 'center' },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
  },
  titleBlock: { flex: 1, minWidth: 0 },
  h1: {
    fontSize: 24,
    fontWeight: '900',
    color: palette.text,
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontStyle: 'italic',
  },
  newProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.primaryMid,
    paddingHorizontal: 22,
    paddingVertical: 15,
    minHeight: 48,
    borderRadius: 12,
    shadowColor: '#00296b',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  newProjectBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pageBody: {
    flex: 1,
    paddingBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    minHeight: 178,
    backgroundColor: 'rgba(248,250,252,0.9)',
    borderWidth: 1,
    borderColor: '#d1d5dc',
    borderRadius: 18,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: CYAN_ICON_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitles: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.text,
    lineHeight: 22,
  },
  cardDesc: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    fontWeight: '500',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    alignItems: 'center',
  },
  pillAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7c3aed',
  },
  pillAdminText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  pillSlate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
  },
  pillSlateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  pillOwner: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
  },
  pillOwnerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  cardRule: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: 12,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerMeta: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  emptyView: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '900', color: palette.text },
  emptySubText: { textAlign: 'center', color: palette.muted, fontSize: 13, lineHeight: 18, paddingHorizontal: 16 },
  emptyBtn: {
    backgroundColor: palette.primaryMid,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
})
