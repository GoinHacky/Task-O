import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { TaskOLogo } from '@/src/components/TaskOLogo'
import { useSession } from '@/src/context/SessionContext'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { session, clearRecoveryMode } = useSession()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSave() {
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.')
      return
    }
    if (!session) {
      Alert.alert('Session required', 'Open the reset link from your email again.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      Alert.alert('Update failed', error.message)
      return
    }
    clearRecoveryMode()
    Alert.alert('Success', 'Your password was updated.', [
      {
        text: 'Sign in',
        onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <TaskOLogo size={30} rounded={14} />
          </View>
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>Choose a strong password for your account.</Text>

          <View style={styles.card}>
            <Text style={styles.label}>New password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#60a5fa" style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
            </View>
            <Text style={styles.label}>Confirm</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#60a5fa" style={styles.inputIcon} />
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
            </View>
            <Pressable disabled={loading} onPress={onSave}>
              <LinearGradient
                colors={[palette.gradientStart, palette.primary, palette.primaryDeep]}
                style={styles.submit}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Update password</Text>}
              </LinearGradient>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.back()}
            style={styles.backRow}
          >
            <Ionicons name="arrow-back" size={18} color={palette.primary} />
            <Text style={styles.back}>Back</Text>
          </Pressable>
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
