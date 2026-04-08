import { Ionicons } from '@expo/vector-icons'
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer'
import { useRouter, usePathname, useSegments } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { TaskOLogo } from './TaskOLogo'
import { useSession } from '../context/SessionContext'
import { useNotifications } from '../context/NotificationContext'
import { fetchProjectsForCurrentUser } from '../lib/fetchUserProjects'
import { supabase } from '../lib/supabase'
import { ProjectItem } from '../types'
import { palette } from '../theme'

type MenuItem = {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  path: string
  hasDot?: boolean
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'HOME', icon: 'home-outline', path: '/dashboard' },
  { label: 'INBOX', icon: 'mail-outline', path: '/inbox' },
  { label: 'CALENDAR', icon: 'calendar-outline', path: '/calendar' },
  { label: 'SETTINGS', icon: 'settings-outline', path: '/settings' },
  { label: 'SUPPORT', icon: 'help-circle-outline', path: '/support' },
]

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const segments = useSegments()
  const { session } = useSession()
  const { unreadCount } = useNotifications()

  const activeProjectIdFromRoute = useMemo(() => {
    const i = segments.findIndex(s => s === 'project')
    if (i >= 0 && segments[i + 1]) return String(segments[i + 1])
    return null
  }, [segments])
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [projectsExpanded, setProjectsExpanded] = useState(true)

  const loadProjects = useCallback(async () => {
    if (!session?.user) {
      setProjects([])
      return
    }
    const data = await fetchProjectsForCurrentUser('name_asc')
    setProjects((data || []) as ProjectItem[])
  }, [session?.user])

  useEffect(() => {
    if (session?.user) {
      loadProjects()
    } else {
      setProjects([])
    }
  }, [session, loadProjects])

  const drawerState = props.state
  const isDrawerOpen = drawerState?.history?.some((h: any) => h.type === 'drawer' && h.status === 'open')

  useEffect(() => {
    if (isDrawerOpen && session?.user) {
      loadProjects()
    }
  }, [isDrawerOpen, session?.user, loadProjects])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/(auth)/login')
  }

  const navigate = (path: string) => {
    props.navigation.closeDrawer()
    router.push(path as any)
  }

  const pathBase = pathname?.split('?')[0] ?? ''

  const isProjectActive = (id: string) => {
    if (activeProjectIdFromRoute === id) return true
    return pathBase === `/project/${id}` || pathBase.startsWith(`/project/${id}/`)
  }

  /** Highlight PROJECTS row on the list screen or when inside any project (matches drawer reference). */
  const isProjectsHeaderActive =
    pathBase === '/projects' || pathBase.startsWith('/projects/') || pathBase.startsWith('/project/')

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <TaskOLogo size={42} noBox />
          <Text style={styles.brandText}>Task-O</Text>
        </View>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        <View style={styles.menu}>
          {MENU_ITEMS.slice(0, 1).map(item => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`)
            return (
              <Pressable
                key={item.label}
                onPress={() => navigate(item.path)}
                style={[styles.menuItem, isActive && styles.activeMenuItem]}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isActive ? drawerColors.selectedAccent : palette.text}
                  style={styles.menuIcon}
                />
                <Text style={[styles.menuText, isActive && styles.activeMenuText]}>{item.label}</Text>
                {item.hasDot && <View style={styles.redDot} />}
              </Pressable>
            )
          })}

          {/* Collapsible PROJECTS (matches reference: grid icon, title, chevron, list with dot + pill) */}
          <View style={styles.projectsSection}>
            <View style={[styles.projectsHeaderRow, isProjectsHeaderActive && styles.activeMenuItem]}>
              <Pressable
                style={styles.projectsHeaderLeft}
                onPress={() => navigate('/projects')}
                accessibilityRole="button"
                accessibilityLabel="Open all projects"
              >
                <Ionicons
                  name="grid-outline"
                  size={20}
                  color={isProjectsHeaderActive ? drawerColors.selectedAccent : drawerColors.projectsHeaderIcon}
                  style={styles.menuIcon}
                />
                <Text style={[styles.projectsHeaderTitle, isProjectsHeaderActive && styles.projectsHeaderTitleActive]}>
                  PROJECTS
                </Text>
              </Pressable>
              {projects.length > 0 ? (
                <Pressable
                  onPress={() => setProjectsExpanded(e => !e)}
                  hitSlop={12}
                  style={styles.projectsChevronBtn}
                  accessibilityRole="button"
                  accessibilityLabel={projectsExpanded ? 'Collapse projects' : 'Expand projects'}
                >
                  <Ionicons
                    name={projectsExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={18}
                    color={isProjectsHeaderActive ? drawerColors.selectedAccent : drawerColors.chevron}
                  />
                </Pressable>
              ) : null}
            </View>

            {projectsExpanded && projects.length > 0 && (
              <View style={styles.projectsList}>
                {projects.map(p => {
                  const active = isProjectActive(p.id)
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => navigate(`/project/${p.id}`)}
                      style={[styles.projectRow, active && styles.projectRowActive]}
                    >
                      <View style={[styles.projectDot, !active && styles.projectDotInactive]} />
                      <Text style={[styles.projectRowText, active && styles.projectRowTextActive]} numberOfLines={1}>
                        {(p.name || 'Untitled').toUpperCase()}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
          </View>

          {MENU_ITEMS.slice(1).map(item => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`)
            const showBadge = item.label === 'INBOX' && unreadCount > 0
            return (
              <Pressable
                key={item.label}
                onPress={() => navigate(item.path)}
                style={[styles.menuItem, isActive && styles.activeMenuItem]}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isActive ? drawerColors.selectedAccent : palette.text}
                  style={styles.menuIcon}
                />
                <Text style={[styles.menuText, isActive && styles.activeMenuText]}>{item.label}</Text>
                {showBadge && (
                  <View style={styles.inboxBadge}>
                    <Text style={styles.inboxBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
                {item.hasDot && <View style={styles.redDot} />}
              </Pressable>
            )
          })}

          <Pressable onPress={handleLogout} style={styles.menuItem}>
            <Ionicons name="log-out-outline" size={20} color={palette.text} style={styles.menuIcon} />
            <Text style={styles.menuText}>LOGOUT</Text>
          </Pressable>
        </View>
      </DrawerContentScrollView>
    </View>
  )
}

const drawerColors = {
  projectsHeaderIcon: '#1e3a5f',
  projectsHeaderTitle: '#1e3a5f',
  chevron: '#94a3b8',
  /** Same highlight for menu items + selected project row */
  selectedBg: 'rgba(0, 119, 182, 0.16)',
  selectedAccent: palette.primaryMid,
  projectDotInactive: '#cbd5e1',
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandText: { fontSize: 24, fontWeight: '900', color: palette.text, letterSpacing: -0.5 },
  scrollContent: { paddingTop: 0 },
  menu: { paddingHorizontal: 16, gap: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    position: 'relative',
  },
  activeMenuItem: { backgroundColor: drawerColors.selectedBg },
  menuIcon: { marginRight: 16 },
  menuText: { fontSize: 13, fontWeight: '800', color: palette.text, letterSpacing: 0.8 },
  activeMenuText: { color: drawerColors.selectedAccent, fontWeight: '900' },
  redDot: {
    position: 'absolute',
    right: 16,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  inboxBadge: {
    position: 'absolute',
    right: 12,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  inboxBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
  },
  projectsSection: {
    marginBottom: 4,
  },
  projectsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  projectsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectsChevronBtn: {
    padding: 4,
  },
  projectsHeaderTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: drawerColors.projectsHeaderTitle,
    letterSpacing: 1,
  },
  projectsHeaderTitleActive: {
    color: drawerColors.selectedAccent,
  },
  projectsList: {
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 4,
    gap: 6,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 10,
  },
  projectRowActive: {
    backgroundColor: drawerColors.selectedBg,
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 182, 0.35)',
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: drawerColors.selectedAccent,
  },
  projectDotInactive: {
    backgroundColor: drawerColors.projectDotInactive,
  },
  projectRowText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: palette.text,
    letterSpacing: 0.6,
  },
  projectRowTextActive: {
    fontWeight: '900',
    color: drawerColors.selectedAccent,
  },
})
