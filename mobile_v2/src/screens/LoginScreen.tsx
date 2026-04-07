import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { type Href, Link, Redirect, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AuthBackdrop } from '@/src/components/AuthBackdrop'
import { TaskOLogo } from '@/src/components/TaskOLogo'
import { useSession } from '@/src/context/SessionContext'
import { devError, devLog } from '@/src/lib/devLog'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

export default function LoginScreen() {
  const { session } = useSession()
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (session) {
    return <Redirect href="/dashboard" />
  }

  async function onSignIn() {
    setError('')
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    setLoading(true)
    devLog('login', 'email sign-in requested', { email })
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      devError('login', 'email sign-in failed', err)
      setError(err.message)
    }
    setLoading(false)
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
              <Pressable style={styles.logoWrap} accessibilityRole="button">
                <TaskOLogo size={42} rounded={18} />
              </Pressable>
            </Link>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your premium productivity suite</Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

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
              <View style={styles.pwHeader}>
                <Text style={styles.label}>Password</Text>
                <Link href={'/forgot-password' as Href} asChild>
                  <Pressable>
                    <Text style={styles.forgot}>Forgot password?</Text>
                  </Pressable>
                </Link>
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed" size={20} color={palette.primary} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                </Pressable>
              </View>
            </View>

            <Pressable disabled={loading} onPress={onSignIn} style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
              <LinearGradient
                colors={[palette.gradientStart, palette.primary, palette.primaryDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submit}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Sign In</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footer}>New to Task-O? </Text>
            <Link href="/register" asChild>
              <Pressable>
                <Text style={styles.footerLink}>Create an account</Text>
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
  header: { alignItems: 'center', marginBottom: 40 },
  logoWrap: { marginBottom: 24, shadowColor: palette.primary, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
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
  inputGroup: { marginBottom: 24 },
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
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: palette.text, fontWeight: '600' },
  pwHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgot: { fontSize: 13, color: palette.primary, fontWeight: '700' },
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
  footerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 40, alignItems: 'center' },
  footer: { fontSize: 15, color: palette.muted, fontWeight: '600' },
  footerLink: { color: palette.primary, fontWeight: '800', fontSize: 15 },
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
})
