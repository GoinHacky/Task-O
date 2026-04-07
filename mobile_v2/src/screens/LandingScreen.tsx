import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, Redirect } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { TaskOLogo } from '@/src/components/TaskOLogo'
import { useSession } from '@/src/context/SessionContext'
import { palette } from '@/src/theme'



export default function LandingScreen() {
  const { session } = useSession()
  const insets = useSafeAreaInsets()

  if (session) {
    return <Redirect href="/dashboard" />
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AuthGlow />
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={{ marginBottom: 32 }}>
            <TaskOLogo size={64} rounded={24} />
          </View>
          <Text style={styles.heroTitle}>
            A smarter way to{' '}
            <Text style={styles.heroAccent}>get work done</Text>
          </Text>
          
          <View style={styles.heroBtns}>
            <Link href="/register" asChild>
              <Pressable>
                <LinearGradient
                  colors={[palette.gradientStart, palette.primary, palette.primaryDeep]}
                  style={styles.primaryBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.primaryBtnText}>Get started</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </LinearGradient>
              </Pressable>
            </Link>
            <Link href="/login" asChild>
              <Pressable style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Sign in to your account</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </View>
  )
}

function AuthGlow() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.glow, { top: -40, left: -40 }]} />
      <View style={[styles.glow, { bottom: -60, right: -40, opacity: 0.7 }]} />
    </View>
  )
}



const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(0,82,204,0.07)',
  },
  hero: { paddingHorizontal: 22, alignItems: 'center', width: '100%' },
  heroTitle: {
    fontSize: 34,
    lineHeight: 44,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -1,
  },
  heroAccent: { color: palette.primary },
  heroBtns: { marginTop: 40, gap: 12, width: '100%', maxWidth: 320 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,82,204,0.12)',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  secondaryBtnText: { color: '#4b5563', fontSize: 15, fontWeight: '700' },
})
