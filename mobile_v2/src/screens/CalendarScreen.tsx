import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { DrawerScreenHeader } from '@/src/components/ScreenHeader'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { FadeIn } from '@/src/components/FadeIn'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { ScreenSkeleton } from '@/src/components/Skeleton'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type CalTask = {
  id: string
  title: string
  due_date: string | null
  priority: string | null
  status: string
  project_id: string | null
  projects?: { name: string }[] | { name: string } | null
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function priColor(p: string | null) {
  if (p === 'high') return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' }
  if (p === 'urgent') return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' }
  return { bg: '#eef2ff', text: '#6366f1', border: '#c7d2fe' }
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [tasks, setTasks] = useState<CalTask[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)

  const loadTasks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setTasks([]); setLoading(false); return }
    const ms = startOfMonth(currentMonth).toISOString()
    const me = endOfMonth(currentMonth).toISOString()
    const { data } = await supabase
      .from('tasks')
      .select('id, title, due_date, priority, status, project_id, projects:project_id ( name )')
      .eq('assigned_to', user.id)
      .not('due_date', 'is', null)
      .gte('due_date', ms)
      .lte('due_date', me)
      .order('due_date', { ascending: true })
    setTasks((data || []) as CalTask[])
    setLoading(false)
  }, [currentMonth])

  useEffect(() => { loadTasks() }, [loadTasks])

  const prevMonth = () => setCurrentMonth(m => subMonths(m, 1))
  const nextMonth = () => setCurrentMonth(m => addMonths(m, 1))
  const goToday = () => {
    const now = new Date()
    setCurrentMonth(now)
    setSelectedDate(now)
  }

  const monthLabel = format(currentMonth, 'MMMM yyyy')

  const calendarDays = useMemo(() => {
    const ms = startOfMonth(currentMonth)
    const me = endOfMonth(currentMonth)
    const start = startOfWeek(ms)
    const end = endOfWeek(me)
    const days: Date[] = []
    let d = start
    while (d <= end) {
      days.push(d)
      d = addDays(d, 1)
    }
    return days
  }, [currentMonth])

  const weeks = useMemo(() => {
    const rows: Date[][] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      rows.push(calendarDays.slice(i, i + 7))
    }
    return rows
  }, [calendarDays])

  const tasksByDay = useMemo(() => {
    const map: Record<string, CalTask[]> = {}
    for (const t of tasks) {
      if (!t.due_date) continue
      const key = format(parseISO(t.due_date), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(t)
    }
    return map
  }, [tasks])

  const today = new Date()
  const ms = startOfMonth(currentMonth)

  // Keep selected date inside the visible month
  useEffect(() => {
    if (!selectedDate || !isSameMonth(selectedDate, currentMonth)) {
      setSelectedDate(ms)
    }
  }, [currentMonth, ms, selectedDate])

  const tasksForSelectedDay = useMemo(() => {
    if (!selectedDate) return []
    return tasks.filter(
      t => t.due_date && isSameDay(parseISO(t.due_date), selectedDate),
    )
  }, [tasks, selectedDate])

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <DrawerScreenHeader
        onAddTask={() => setTaskModal(true)}
        onAddProject={() => setProjectModal(true)}
        onAddTeam={() => setTeamModal(true)}
        onAddMember={() => setMemberModal(true)}
      />
      {loading ? (
        <ScreenSkeleton />
      ) : (
      <FadeIn>
        <ScrollView
          contentContainerStyle={styles.page}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await loadTasks(); setRefreshing(false) }}
              tintColor={palette.primaryMid}
            />
          }
        >
          {/* ─── Header ─── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.calIconBox}>
                <Ionicons name="calendar" size={22} color={palette.primaryMid} />
              </View>
              <View>
                <Text style={styles.monthTitle}>{monthLabel}</Text>
                <Text style={styles.monthSub}>{tasks.length} tasks this month</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Pressable onPress={prevMonth} style={styles.navBtn} hitSlop={8}>
                <Ionicons name="chevron-back" size={20} color={palette.muted} />
              </Pressable>
              <Pressable onPress={goToday} style={styles.todayBtn} hitSlop={8}>
                <Text style={styles.todayBtnText}>Today</Text>
              </Pressable>
              <Pressable onPress={nextMonth} style={styles.navBtn} hitSlop={8}>
                <Ionicons name="chevron-forward" size={20} color={palette.muted} />
              </Pressable>
            </View>
          </View>

          {/* ─── Calendar Card ─── */}
          <View style={styles.calCard}>
            {/* Day-of-week labels */}
            <View style={styles.dowRow}>
              {DAY_NAMES.map(d => (
                <View key={d} style={styles.dowCell}>
                  <Text style={styles.dowText}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Grid */}
            <View style={styles.grid}>
              {weeks.map((week, wi) => (
                <View key={wi} style={styles.weekRow}>
                  {week.map((day, di) => {
                    const inMonth = isSameMonth(day, ms)
                    const isToday = isSameDay(day, today)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const key = format(day, 'yyyy-MM-dd')
                    const dayTasks = tasksByDay[key] || []
                    const isLast = wi === weeks.length - 1

                    return (
                      <Pressable
                        key={di}
                        style={[
                          styles.cell,
                          !inMonth && styles.cellDimmed,
                          di === 6 && styles.cellRight,
                          isLast && styles.cellBottom,
                          isSelected && styles.cellSelected,
                        ]}
                        onPress={() => setSelectedDate(day)}
                      >
                        <View style={styles.cellHeader}>
                          {isToday ? (
                            <View style={styles.todayBadge}>
                              <Text style={styles.todayBadgeText}>{format(day, 'd')}</Text>
                            </View>
                          ) : (
                            <Text style={[styles.dayNum, !inMonth && styles.dayNumDim]}>
                              {format(day, 'd')}
                            </Text>
                          )}
                        </View>
                        <View style={styles.pillArea}>
                          {dayTasks.slice(0, 2).map(t => {
                            const c = priColor(t.priority)
                            return (
                              <View key={t.id} style={[styles.pill, { backgroundColor: c.bg, borderColor: c.border }]}>
                                <Text style={[styles.pillText, { color: c.text }]} numberOfLines={1}>
                                  {t.title}
                                </Text>
                              </View>
                            )
                          })}
                          {dayTasks.length > 2 && (
                            <Text style={styles.moreText}>+{dayTasks.length - 2}</Text>
                          )}
                        </View>
                      </Pressable>
                    )
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* ─── Day Task List ─── */}
          <View style={styles.listSection}>
            <View style={styles.listCard}>
              <View style={styles.listHeaderRow}>
                <View>
                  <Text style={styles.listKicker}>SCHEDULED TASKS</Text>
                  <Text style={styles.listTitle}>
                    {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'No date selected'}
                  </Text>
                </View>
                {tasksForSelectedDay.length > 0 && (
                  <View style={styles.listCountPill}>
                    <Text style={styles.listCountText}>
                      {tasksForSelectedDay.length} task{tasksForSelectedDay.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                )}
              </View>

              {(!selectedDate || tasksForSelectedDay.length === 0) ? (
                <View style={styles.listEmptyCard}>
                  <Ionicons name="calendar-outline" size={22} color="#cbd5e1" />
                  <Text style={styles.listEmptyTitle}>Nothing scheduled</Text>
                  <Text style={styles.listEmpty}>
                    Pick a different date or create a new task from the header shortcuts.
                  </Text>
                </View>
              ) : (
                tasksForSelectedDay.map(t => {
                  if (!t.due_date) return null
                  const dateLabel = format(parseISO(t.due_date), 'MMM d')
                  const projectName = !t.projects
                    ? undefined
                    : Array.isArray(t.projects)
                      ? t.projects[0]?.name
                      : t.projects.name
                  const c = priColor(t.priority)

                  return (
                    <Pressable
                      key={t.id}
                      style={styles.listItem}
                      onPress={() => router.push(`/task/${t.id}` as any)}
                    >
                      <View style={styles.listDateCol}>
                        <Text style={styles.listDate}>{dateLabel}</Text>
                      </View>
                      <View style={styles.listMainCol}>
                        <Text style={styles.listTitleText} numberOfLines={1}>
                          {t.title}
                        </Text>
                        {!!projectName && (
                          <Text style={styles.listProject} numberOfLines={1}>
                            {projectName}
                          </Text>
                        )}
                      </View>
                      <View style={styles.listMetaCol}>
                        <View
                          style={[
                            styles.listPill,
                            { backgroundColor: c.bg, borderColor: c.border },
                          ]}
                        >
                          <Text style={[styles.listPillText, { color: c.text }]}>
                            {t.priority ? t.priority.toUpperCase() : 'NORMAL'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  )
                })
              )}
            </View>
          </View>
        </ScrollView>
      </FadeIn>
      )}

      <CreateTaskModal visible={taskModal} onClose={() => setTaskModal(false)} onCreated={loadTasks} onCreateProject={() => setProjectModal(true)} />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onCreated={loadTasks} />
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreated={loadTasks} onCreateProject={() => setProjectModal(true)} />
      <InviteMemberModal visible={memberModal} onClose={() => setMemberModal(false)} onCreated={loadTasks} onCreateProject={() => setProjectModal(true)} />
    </View>
  )
}

const BORDER_COLOR = 'rgba(148,163,184,0.28)'

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  page: { paddingHorizontal: 14, paddingBottom: 80, paddingTop: 8 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  calIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,119,182,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: { fontSize: 20, fontWeight: '900', color: palette.text, letterSpacing: -0.5 },
  monthSub: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.08)',
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  todayBtnText: { fontSize: 10, fontWeight: '900', color: palette.primaryMid, textTransform: 'uppercase', letterSpacing: 1.2 },

  calCard: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 14,
    shadowColor: '#94a3b8',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
  },
  dowRow: { flexDirection: 'row', marginBottom: 6 },
  dowCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  dowText: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 },

  grid: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  weekRow: { flexDirection: 'row' },
  cell: {
    flex: 1,
    minHeight: 64,
    padding: 4,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: palette.surface,
  },
  cellDimmed: { backgroundColor: 'rgba(148,163,184,0.06)' },
  cellSelected: {
    backgroundColor: 'rgba(129,140,248,0.12)',
  },
  cellRight: { borderRightWidth: 1 },
  cellBottom: { borderBottomWidth: 1 },
  cellHeader: { marginBottom: 2 },
  dayNum: { fontSize: 11, fontWeight: '900', color: palette.text },
  dayNumDim: { color: '#cbd5e1' },
  todayBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: palette.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primaryMid,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  todayBadgeText: { fontSize: 10, fontWeight: '900', color: '#fff' },
  pillArea: { gap: 2 },
  pill: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillText: { fontSize: 8, fontWeight: '800' },
  moreText: { fontSize: 7, fontWeight: '900', color: palette.primaryMid, textAlign: 'right', marginTop: 1 },

  listSection: {
    marginTop: 20,
    paddingHorizontal: 2,
    paddingBottom: 32,
  },
  listCard: {
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listKicker: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: palette.text,
    marginTop: 2,
    marginBottom: 6,
  },
  listCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.03)',
  },
  listCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  listEmptyCard: {
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: '#f8fafc',
    marginTop: 4,
  },
  listEmptyTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '800',
    color: palette.text,
  },
  listEmpty: {
    fontSize: 11,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
  },
  listDateCol: {
    width: 70,
  },
  listDate: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.textMuted,
  },
  listMainCol: {
    flex: 1,
    paddingRight: 8,
  },
  listTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.text,
  },
  listProject: {
    fontSize: 11,
    color: palette.textMuted,
    marginTop: 1,
  },
  listMetaCol: {
    alignItems: 'flex-end',
  },
  listPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  listPillText: {
    fontSize: 9,
    fontWeight: '900',
  },
})
