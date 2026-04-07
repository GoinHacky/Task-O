import { Ionicons } from '@expo/vector-icons'
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer'
import { useRouter, usePathname } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { TaskOLogo } from './TaskOLogo'
import { useSession } from '../context/SessionContext'
import { supabase } from '../lib/supabase'
import { palette } from '../theme'

type MenuItem = {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  path: string
  hasDot?: boolean
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'HOME', icon: 'home-outline', path: '/dashboard' },
  { label: 'PROJECTS', icon: 'grid-outline', path: '/projects' },
  { label: 'INBOX', icon: 'mail-outline', path: '/inbox' },
  { label: 'CALENDAR', icon: 'calendar-outline', path: '/calendar' },
  { label: 'SETTINGS', icon: 'settings-outline', path: '/settings' },
  { label: 'SUPPORT', icon: 'help-circle-outline', path: '/support' },
]

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { session } = useSession()
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null } | null>(null)

  useEffect(() => {
    if (session?.user) {
      supabase
        .from('users')
        .select('full_name')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          setProfile({
            full_name: data?.full_name || 'User',
            email: session.user.email || '',
          })
        })
    }
  }, [session])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/landing')
  }

  const navigate = (path: string) => {
    props.navigation.closeDrawer()
    router.push(path as any)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <TaskOLogo size={42} noBox />
          <Text style={styles.brandText}>Task-O</Text>
        </View>
        <Pressable onPress={() => props.navigation.closeDrawer()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={palette.muted} />
        </Pressable>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.path
            return (
              <Pressable
                key={item.label}
                onPress={() => navigate(item.path)}
                style={[styles.menuItem, isActive && styles.activeMenuItem]}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isActive ? palette.primary : palette.text}
                  style={styles.menuIcon}
                />
                <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                  {item.label}
                </Text>
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

      {/* Footer Profile */}
      <View style={styles.footer}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {profile?.full_name || 'User'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {profile?.email || 'user@example.com'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
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
  closeBtn: { padding: 4 },
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
  activeMenuItem: { backgroundColor: '#f3f4ff' },
  menuIcon: { marginRight: 16 },
  menuText: { fontSize: 13, fontWeight: '800', color: palette.text, letterSpacing: 0.8 },
  activeMenuText: { color: palette.primary, fontWeight: '900' },
  redDot: {
    position: 'absolute',
    right: 16,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingBottom: 40,
  },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 14, fontWeight: '800', color: palette.text },
  profileEmail: { fontSize: 11, fontWeight: '600', color: palette.muted, marginTop: 2 },
})
