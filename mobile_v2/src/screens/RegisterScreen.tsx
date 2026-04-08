import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Link, Redirect, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AuthBackdrop } from '@/src/components/AuthBackdrop'
import { TaskOLogo } from '@/src/components/TaskOLogo'
import { GoogleIcon } from '@/src/components/icons/GoogleIcon'
import { useSession } from '@/src/context/SessionContext'
import { signInWithGoogle } from '@/src/lib/googleOAuth'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

export default function RegisterScreen() {
  const { session } = useSession()
  const insets = useSafeAreaInsets()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (session) {
    return <Redirect href="/dashboard" />
  }

  async function onRegister() {
    setError('')
    if (!email || !password || !fullName.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
    if (existingUser) {
      setError('The email is already used')
      setLoading(false)
      return
    }
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    if (data.user) {
      if (data.session) {
        Alert.alert('Welcome', 'Your account is ready.')
      } else {
        setSuccess(true)
      }
    }
    setLoading(false)
  }

  async function onGoogle() {
    if (googleLoading) return
    setError('')
    setGoogleLoading(true)
    const res = await signInWithGoogle()
    if (!res.ok) setError(res.error || 'Google sign-in failed.')
    setGoogleLoading(false)
  }

  if (success) {
    return (
      <View style={[styles.confirmSafe, { paddingTop: insets.top }]}>
        <View style={styles.bgOrbTopLeft} />
        <View style={styles.bgOrbBottomRight} />
        <View style={styles.bgSoftCenter} />

        <View style={styles.confirmCardWrap}>
          <View style={styles.successIconButton}>
            <Ionicons name="checkmark" size={30} color="#fff" />
          </View>
          <Text style={styles.confirmTitle}>Check your email</Text>
          <Text style={styles.confirmSubtitle}>A confirmation link has been sent</Text>

          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(235,244,255,0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.confirmGlassCard}
          >
            <Text style={styles.successBody}>
              We sent a link to <Text style={styles.successEmail}>{email}</Text>. Click it to verify and get started.
            </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text style={styles.confirmLink}>Back to sign in</Text>
              </Pressable>
            </Link>
          </LinearGradient>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <Pressable style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => router.replace('/landing')} hitSlop={20}>
        <Ionicons name="chevron-back" size={24} color={palette.text} />
      </Pressable>
      <AuthBackdrop />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scroll} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Link href="/landing" asChild>
              <Pressable style={styles.logoWrap}>
                <TaskOLogo size={42} rounded={18} />
              </Pressable>
            </Link>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands of high-achievers today</Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person" size={20} color={palette.primary} style={styles.inputIcon} />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail" size={20} color={palette.primary} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed" size={20} color={palette.primary} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                </Pressable>
              </View>
            </View>

            <Pressable disabled={loading} onPress={onRegister} style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
              <LinearGradient
                colors={[palette.gradientStart, palette.primary, palette.primaryDeep]}
                style={styles.submit}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Create Account</Text>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            <Pressable
              disabled={googleLoading}
              onPress={onGoogle}
              style={({ pressed }) => [
                styles.googleBtn,
                (pressed || googleLoading) && { transform: [{ scale: 0.99 }], opacity: 0.92 },
              ]}
            >
              <View style={styles.googleInner}>
                <GoogleIcon size={18} />
                <Text style={styles.googleText}>{googleLoading ? 'Please wait…' : 'Continue with Google'}</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footer}>Already have an account? </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text style={styles.footerLink}>Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { paddingHorizontal: 32, paddingBottom: 60, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoWrap: { marginBottom: 20, shadowColor: palette.primary, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  title: { fontSize: 32, fontWeight: '900', color: palette.text, letterSpacing: -1 },
  subtitle: { fontSize: 15, color: palette.muted, marginTop: 8, fontWeight: '600' },
  form: { width: '100%', maxWidth: 400 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  errorText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: palette.text, marginBottom: 10, marginLeft: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    borderRadius: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: palette.text, fontWeight: '600' },
  submit: {
    marginTop: 10,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(148,163,184,0.35)' },
  orText: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  googleBtn: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  googleInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleText: { fontSize: 14, fontWeight: '800', color: '#1f2937' },
  footerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 32, alignItems: 'center' },
  footer: { fontSize: 15, color: palette.muted, fontWeight: '600' },
  footerLink: { color: palette.primary, fontWeight: '800', fontSize: 15 },
  successIcon: { marginBottom: 20, shadowColor: '#22c55e', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  successCard: { alignItems: 'center', paddingHorizontal: 20 },
  successBody: { fontSize: 16, color: palette.muted, lineHeight: 24, textAlign: 'center', fontWeight: '500' },
  successLink: { marginTop: 32, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16, backgroundColor: palette.accentSoft },
  successLinkText: { color: palette.primary, fontWeight: '800', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 },
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmSafe: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, overflow: 'hidden' },
  bgOrbTopLeft: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(0,82,204,0.08)',
  },
  bgOrbBottomRight: {
    position: 'absolute',
    bottom: -140,
    right: -140,
    width: 460,
    height: 460,
    borderRadius: 230,
    backgroundColor: 'rgba(99,179,237,0.14)',
  },
  bgSoftCenter: {
    position: 'absolute',
    width: 680,
    height: 360,
    borderRadius: 220,
    backgroundColor: 'rgba(0,82,204,0.05)',
  },
  confirmCardWrap: { width: '100%', maxWidth: 420, alignItems: 'center' },
  successIconButton: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#22c55e',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  confirmTitle: { fontSize: 30, fontWeight: '900', color: '#111827', letterSpacing: -0.8, textAlign: 'center' },
  confirmSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 6, marginBottom: 18, fontWeight: '600', textAlign: 'center' },
  confirmGlassCard: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,82,204,0.15)',
    shadowColor: '#0052CC',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  successEmail: { fontWeight: '800', color: '#111827' },
  confirmLink: { marginTop: 10, fontSize: 14, color: '#0052CC', fontWeight: '800' },
})
