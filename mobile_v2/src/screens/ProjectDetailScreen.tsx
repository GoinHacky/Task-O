import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Keyboard,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { FadeIn } from '@/src/components/FadeIn'
import { ProjectWorkspaceBar, type ProjectWorkspaceTab } from '@/src/components/ProjectWorkspaceBar'
import { ScreenHeader } from '@/src/components/ScreenHeader'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { OverviewTab } from '@/src/components/project-tabs/OverviewTab'
import { TasksTab } from '@/src/components/project-tabs/TasksTab'
import { ActivityTab } from '@/src/components/project-tabs/ActivityTab'
import { TeamsTab } from '@/src/components/project-tabs/TeamsTab'
import { MembersTab } from '@/src/components/project-tabs/MembersTab'
import { ReportsTab } from '@/src/components/project-tabs/ReportsTab'
import { SettingsTab } from '@/src/components/project-tabs/SettingsTab'
import { ScreenSkeleton } from '@/src/components/Skeleton'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

const TAB_SUBTITLE: Record<ProjectWorkspaceTab, string> = {
  overview: 'PROJECT OVERVIEW',
  tasks: 'PROJECT TASKS',
  activity: 'PROJECT ACTIVITY',
  teams: 'PROJECT TEAMS',
  members: 'PROJECT MEMBERS',
  reports: 'PROJECT REPORTS',
  settings: 'PROJECT SETTINGS',
}

export default function ProjectDetailScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState<string | null>(null)

  const validTabs: ProjectWorkspaceTab[] = ['overview', 'tasks', 'activity', 'teams', 'members', 'reports', 'settings']
  const initialTab = validTabs.includes(tab as ProjectWorkspaceTab) ? (tab as ProjectWorkspaceTab) : 'overview'
  const [activeTab, setActiveTab] = useState<ProjectWorkspaceTab>(initialTab)
  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)
  const [tasksRefreshKey, setTasksRefreshKey] = useState(0)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const scrollRef = useRef<ScrollView | null>(null)
  const pendingScrollRef = useRef(false)
  const prevTabRef = useRef(activeTab)

  const barY = useRef(0)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [sticky, setSticky] = useState(false)
  const stickyAnim = useRef(new Animated.Value(0)).current

  const onHeaderLayout = (e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height)
  }

  const onBarLayout = (e: LayoutChangeEvent) => {
    barY.current = e.nativeEvent.layout.y
  }

  const stickyRef = useRef(false)
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y
    const shouldStick = offsetY >= barY.current
    if (shouldStick !== stickyRef.current) {
      stickyRef.current = shouldStick
      setSticky(shouldStick)
      Animated.timing(stickyAnim, {
        toValue: shouldStick ? 1 : 0,
        duration: 0,
        useNativeDriver: true,
      }).start()
    }
  }

  const loadProject = useCallback(async () => {
    if (!id) { setLoading(false); return }
    const { data: project } = await supabase.from('projects').select('name, description').eq('id', id).single()
    if (project) {
      setName((project as { name: string }).name)
      setDescription((project as { description: string | null }).description)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { loadProject() }, [loadProject])
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab
      scrollRef.current?.scrollTo({ y: 0, animated: false })
      pendingScrollRef.current = true
    }
  }, [activeTab])

  const onContentSizeChange = useCallback((_w: number, h: number) => {
    if (pendingScrollRef.current && h > 300) {
      pendingScrollRef.current = false
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    }
  }, [])
  useEffect(() => {
    const onShow = (e: any) => {
      // Extra room while keyboard is open so focused fields can scroll above it.
      setKeyboardInset(Math.max(0, (e?.endCoordinates?.height || 0) - insets.bottom))
    }
    const onHide = () => setKeyboardInset(0)
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSub = Keyboard.addListener(showEvent, onShow)
    const hideSub = Keyboard.addListener(hideEvent, onHide)
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [insets.bottom])

  function renderTabContent() {
    if (!id) return null
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            projectId={id}
            onOpenMemberModal={() => setMemberModal(true)}
            onOpenTaskModal={() => setTaskModal(true)}
          />
        )
      case 'tasks':
        return (
          <TasksTab
            projectId={id}
            onOpenNewTask={() => setTaskModal(true)}
            tasksRefreshKey={tasksRefreshKey}
          />
        )
      case 'activity': return <ActivityTab projectId={id} />
      case 'teams': return <TeamsTab projectId={id} />
      case 'members': return <MembersTab projectId={id} />
      case 'reports': return <ReportsTab projectId={id} />
      case 'settings': return <SettingsTab projectId={id} />
    }
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View onLayout={onHeaderLayout}>
        <ScreenHeader
          onBack={() => router.back()}
          onAddTask={() => setTaskModal(true)}
          onAddProject={() => setProjectModal(true)}
          onAddTeam={() => setTeamModal(true)}
          onAddMember={() => setMemberModal(true)}
        />
      </View>

      {/* Sticky bar — only after project data is ready */}
      {!loading ? (
        <Animated.View
          pointerEvents={sticky ? 'auto' : 'none'}
          style={[styles.stickyBar, { top: headerHeight + insets.top, opacity: stickyAnim }]}
        >
          <ProjectWorkspaceBar active={activeTab} onTabChange={setActiveTab} />
        </Animated.View>
      ) : null}

      {loading ? (
        <ScreenSkeleton />
      ) : (
        <FadeIn style={styles.contentWrap}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 120 + keyboardInset }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onContentSizeChange={onContentSizeChange}
          >
          <View style={styles.headBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.h1Project} numberOfLines={2}>
                {(name || 'Project').toUpperCase()}
              </Text>
              <Text style={styles.h1Slash}>/</Text>
            </View>
            <Text style={styles.h1Sub}>{TAB_SUBTITLE[activeTab]}</Text>
            {description ? (
              <Text style={styles.descCaps} numberOfLines={4}>
                {description.toUpperCase()}
              </Text>
            ) : null}
          </View>

          <View onLayout={onBarLayout}>
            <ProjectWorkspaceBar active={activeTab} onTabChange={setActiveTab} />
          </View>

          <View key={activeTab}>
            {renderTabContent()}
          </View>
          </ScrollView>
        </FadeIn>
      )}

      <CreateTaskModal
        visible={taskModal}
        defaultProjectId={id}
        onClose={() => setTaskModal(false)}
        onCreated={() => {
          setTaskModal(false)
          setTasksRefreshKey(k => k + 1)
        }}
      />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onCreated={() => setProjectModal(false)} />
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreated={() => setTeamModal(false)} />
      <InviteMemberModal visible={memberModal} onClose={() => setMemberModal(false)} onCreated={() => setMemberModal(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  contentWrap: { flex: 1 },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: palette.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(203,213,225,0.5)',
  },
  scrollBody: { paddingHorizontal: 16, gap: 16 },
  headBlock: { gap: 8, marginTop: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  h1Project: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: palette.text,
    textTransform: 'uppercase',
    maxWidth: '90%',
  },
  h1Slash: { fontSize: 22, fontWeight: '200', color: '#e2e8f0', marginLeft: 8 },
  h1Sub: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    color: palette.text,
    textTransform: 'uppercase',
  },
  descCaps: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    letterSpacing: 2,
    lineHeight: 16,
  },
})
