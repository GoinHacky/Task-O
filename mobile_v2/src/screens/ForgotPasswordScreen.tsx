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
import * as Linking from 'expo-linking'
import { Link } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AuthBackdrop } from '@/src/components/AuthBackdrop'
import { TaskOLogo } from '@/src/components/TaskOLogo'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function onReset() {
    setError('')
    if (!email.trim()) {
      setError('Enter your email address.')
      return
    }
    setLoading(true)
    const redirectTo = Linking.createURL('/(auth)/reset-password')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    if (err) setError(err.message)
    else setSuccess(true)
    setLoading(false)
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <AuthBackdrop />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Link href="/landing" asChild>
            <Pressable style={styles.logoWrap}>
              <TaskOLogo size={30} rounded={14} />
            </Pressable>
          </Link>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>We&apos;ll send a recovery link to your email</Text>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View style={styles.okBox}>
                <Ionicons name="checkmark-circle" size={28} color="#22c55e" />
                <Text style={styles.okText}>Check your inbox for the reset link.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color="#60a5fa" style={styles.inputIcon} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <Pressable disabled={loading} onPress={onReset}>
                  <LinearGradient
                    colors={[palette.gradientStart, palette.primary, palette.primaryDeep]}
                    style={styles.submit}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Send reset link</Text>}
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </View>

          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.backRow}>
              <Ionicons name="arrow-back" size={18} color={palette.primary} />
              <Text style={styles.back}>Back to sign in</Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { paddingHorizontal: 22, paddingBottom: 40, alignItems: 'center' },
  logoWrap: { marginTop: 8, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 6, marginBottom: 22, textAlign: 'center' },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,82,204,0.1)',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { color: '#dc2626', fontSize: 13 },
  okBox: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  okText: { fontSize: 15, color: '#374151', textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,82,204,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827' },
  submit: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
  back: { color: palette.primary, fontWeight: '700', fontSize: 14 },
})
