import { Ionicons } from '@expo/vector-icons'
import { Redirect, useRouter, useNavigation } from 'expo-router'
import { DrawerActions } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { CreateTaskModal } from '@/src/components/CreateTaskModal'
import { CreateProjectModal } from '@/src/components/CreateProjectModal'
import { CreateTeamModal } from '@/src/components/CreateTeamModal'
import { InviteMemberModal } from '@/src/components/InviteMemberModal'
import { TaskOLogo } from '@/src/components/TaskOLogo'
import { useSession } from '@/src/context/SessionContext'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type Profile = {
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

type Tab = 'general' | 'password' | 'notifications' | 'deletion'

export default function SettingsScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { session } = useSession()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [taskModal, setTaskModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)

  // General
  const [fullName, setFullName] = useState('')

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    push: false,
    mentions: true,
    taskUpdates: true,
  })

  useEffect(() => {
    async function loadProfile() {
      const userId = session?.user?.id
      if (!userId) { setLoading(false); return }
      const { data } = await supabase.from('users').select('full_name,email,avatar_url').eq('id', userId).single()
      const p = (data as Profile) || null
      setProfile(p)
      setFullName(p?.full_name || '')
      setLoading(false)
    }
    loadProfile()
  }, [session?.user?.id])

  if (!session) return <Redirect href="/(auth)/login" />

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  async function handleSave() {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      if (activeTab === 'general') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
          .eq('id', session!.user.id)
        if (updateError) throw updateError
        setSuccess('Profile updated successfully!')
      } else if (activeTab === 'password') {
        if (!currentPassword) throw new Error('Current password is required')
        if (newPassword !== confirmPassword) throw new Error('Passwords do not match')
        if (newPassword.length < 6) throw new Error('Password must be at least 6 characters')
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: session!.user.email!,
          password: currentPassword,
        })
        if (signInError) throw new Error('Incorrect current password')
        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword })
        if (passwordError) throw passwordError
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setSuccess('Password updated successfully!')
      } else if (activeTab === 'notifications') {
        setSuccess('Notification preferences saved!')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; danger?: boolean }[] = [
    { id: 'general', label: 'General', icon: 'person-outline' },
    { id: 'password', label: 'Password', icon: 'lock-closed-outline' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
    { id: 'deletion', label: 'Delete Account', icon: 'trash-outline', danger: true },
  ]

  return (
    <KeyboardAvoidingView
      style={[styles.safe, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        onMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
        onNotification={() => router.push('/notifications')}
        onAddTask={() => setTaskModal(true)}
        onAddProject={() => setProjectModal(true)}
        onAddTeam={() => setTeamModal(true)}
        onAddMember={() => setMemberModal(true)}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Tab Selector */}
        <View style={styles.tabsCard}>
          {tabs.map(tab => (
            <Pressable
              key={tab.id}
              onPress={() => { setActiveTab(tab.id); setError(''); setSuccess('') }}
              style={[
                styles.tabItem,
                activeTab === tab.id && (tab.danger ? styles.tabItemDanger : styles.tabItemActive),
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={
                  activeTab === tab.id
                    ? tab.danger ? '#fff' : palette.accent
                    : palette.muted
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && (tab.danger ? styles.tabLabelDanger : styles.tabLabelActive),
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Status banners */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {success ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {/* General Tab */}
        {activeTab === 'general' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>General Settings</Text>
            <Text style={styles.sectionHint}>Update your identification and presence</Text>

            {/* Avatar placeholder */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>
                  {fullName?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.avatarLabel}>Workspace Avatar</Text>
                <Text style={styles.avatarHint}>
                  This image will be shown alongside your tasks and messages.
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={palette.accent} style={styles.inputIcon} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputRow, styles.inputDisabled]}>
              <Ionicons name="mail-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                value={profile?.email || session.user.email || ''}
                style={[styles.input, { color: '#9ca3af' }]}
                editable={false}
              />
            </View>
            <Text style={styles.inputHint}>Email is used for sign-in and cannot be changed.</Text>
          </View>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Update Password</Text>
            <Text style={styles.sectionHint}>Secure your account with a unique passphrase</Text>

            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={palette.accent} style={styles.inputIcon} />
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showCurrent}
              />
              <Pressable onPress={() => setShowCurrent(!showCurrent)} hitSlop={12}>
                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </Pressable>
            </View>

            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={palette.accent} style={styles.inputIcon} />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showNew}
              />
              <Pressable onPress={() => setShowNew(!showNew)} hitSlop={12}>
                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </Pressable>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={palette.accent} style={styles.inputIcon} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirm}
              />
              <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={12}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </Pressable>
            </View>
          </View>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <Text style={styles.sectionHint}>Control how Task-O reaches out to you</Text>

            {[
              { id: 'email' as const, label: 'Email Notifications', desc: 'Receive project updates via email' },
              { id: 'push' as const, label: 'Push Notifications', desc: 'Receive real-time alerts on device' },
              { id: 'mentions' as const, label: 'Mentions Only', desc: 'Only notify when someone mentions you' },
              { id: 'taskUpdates' as const, label: 'Task Activity', desc: 'Notify when tasks are moved or updated' },
            ].map(item => (
              <View key={item.id} style={styles.notifRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifLabel}>{item.label}</Text>
                  <Text style={styles.notifDesc}>{item.desc}</Text>
                </View>
                <Switch
                  value={notifPrefs[item.id]}
                  onValueChange={val => setNotifPrefs(prev => ({ ...prev, [item.id]: val }))}
                  trackColor={{ false: '#e2e8f0', true: palette.accent }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        )}

        {/* Delete Account Tab */}
        {activeTab === 'deletion' && (
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Delete Account</Text>
            <Text style={styles.dangerDesc}>
              Warning: Deleting your account is permanent. All your projects, tasks, and data will be permanently
              removed. This action cannot be undone.
            </Text>
            <Pressable
              style={styles.dangerBtn}
              onPress={() => {
                Alert.alert(
                  'Delete Account',
                  'Account deletion is currently handled by administration for security reasons.',
                  [{ text: 'OK' }],
                )
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.dangerBtnText}>Delete Account</Text>
            </Pressable>
          </View>
        )}

        {/* Save button (except on delete tab) */}
        {activeTab !== 'deletion' && (
          <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </Pressable>
        )}

        {/* Sign Out */}
        <Pressable
          style={styles.signOutBtn}
          onPress={async () => {
            const { error: e } = await supabase.auth.signOut()
            if (e) Alert.alert('Unable to sign out', e.message)
            else router.replace('/landing')
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      <CreateTaskModal visible={taskModal} onClose={() => setTaskModal(false)} onCreateProject={() => setProjectModal(true)} />
      <CreateProjectModal visible={projectModal} onClose={() => setProjectModal(false)} />
      <CreateTeamModal visible={teamModal} onClose={() => setTeamModal(false)} onCreateProject={() => setProjectModal(true)} />
      <InviteMemberModal visible={memberModal} onClose={() => setMemberModal(false)} onCreateProject={() => setProjectModal(true)} />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, marginTop: 8 },
  backBtn: { padding: 6 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: palette.text },
  heroSub: { fontSize: 12, color: palette.muted, marginTop: 2, fontWeight: '600' },

  tabsCard: {
    borderRadius: 28,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    padding: 8,
    marginBottom: 16,
    gap: 4,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  tabItemActive: {
    backgroundColor: palette.surface,
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.1)',
  },
  tabItemDanger: { backgroundColor: '#dc2626' },
  tabLabel: { fontSize: 14, fontWeight: '800', color: palette.muted },
  tabLabelActive: { color: palette.accent },
  tabLabelDanger: { color: '#fff' },

  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  errorText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  successBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  successText: { color: '#16a34a', fontSize: 12, fontWeight: '700' },

  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: palette.surface,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: palette.text, marginBottom: 4 },
  sectionHint: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },

  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 26, fontWeight: '900', color: palette.accent },
  avatarLabel: { fontSize: 12, fontWeight: '900', color: palette.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  avatarHint: { fontSize: 11, color: palette.muted, marginTop: 4, fontStyle: 'italic', lineHeight: 16 },

  label: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
  },
  inputDisabled: { opacity: 0.55 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: palette.text, fontWeight: '600' },
  inputHint: { fontSize: 10, color: palette.muted, marginTop: 4, fontStyle: 'italic', marginLeft: 2 },

  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    marginBottom: 8,
  },
  notifLabel: { fontSize: 14, fontWeight: '700', color: palette.text },
  notifDesc: { fontSize: 10, color: palette.muted, fontWeight: '500', fontStyle: 'italic', marginTop: 2 },

  dangerCard: {
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 20,
    marginBottom: 16,
  },
  dangerTitle: { fontSize: 20, fontWeight: '800', color: '#dc2626', marginBottom: 8 },
  dangerDesc: { fontSize: 13, color: '#991b1b', lineHeight: 20, marginBottom: 18, fontWeight: '500' },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 16,
  },
  dangerBtnText: { color: '#fff', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.accent,
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    backgroundColor: '#bf1e2e',
    paddingVertical: 15,
  },
  signOutText: { color: '#fff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
})
