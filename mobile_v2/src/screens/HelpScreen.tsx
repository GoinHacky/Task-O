import { Ionicons } from '@expo/vector-icons'
import { type Href, useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { palette } from '@/src/theme'

export default function HelpScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <ScrollView style={[styles.safe, { paddingTop: insets.top }]} contentContainerStyle={styles.body}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
      </View>
      <Text style={styles.title}>Help &amp; Support</Text>
      <Text style={styles.kicker}>We&apos;re here to help you succeed</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <View style={[styles.icon, { backgroundColor: '#ffedd5' }]}>
            <Ionicons name="chatbubbles-outline" size={26} color="#ea580c" />
          </View>
          <Text style={styles.cardTitle}>Live Chat</Text>
          <Text style={styles.cardDesc}>Reach out during business hours for real-time help.</Text>
        </View>
        <View style={styles.card}>
          <View style={[styles.icon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="help-circle-outline" size={26} color={palette.accent} />
          </View>
          <Text style={styles.cardTitle}>Support Center</Text>
          <Text style={styles.cardDesc}>Browse guides and FAQs for quick answers.</Text>
        </View>
        <View style={styles.card}>
          <View style={[styles.icon, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="play-circle-outline" size={26} color="#059669" />
          </View>
          <Text style={styles.cardTitle}>Quick start</Text>
          <Text style={styles.cardDesc}>Use Dashboard → Tasks → Projects to stay aligned with your team.</Text>
        </View>
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>Need personalized help?</Text>
        <Text style={styles.ctaSub}>Create a support ticket and our team will follow up.</Text>
        <Pressable style={styles.ctaBtn} onPress={() => router.push('/support' as Href)}>
          <Ionicons name="send-outline" size={18} color="#fff" />
          <Text style={styles.ctaBtnText}>Create Support Ticket</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  body: { padding: 18, paddingBottom: 48 },
  head: { marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: palette.text },
  kicker: { fontSize: 11, fontWeight: '800', color: palette.muted, letterSpacing: 2, textTransform: 'uppercase', marginTop: 8 },
  grid: { gap: 14, marginTop: 24 },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    padding: 22,
    backgroundColor: palette.surface,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 17, fontWeight: '900', color: palette.text, marginBottom: 8 },
  cardDesc: { fontSize: 13, color: palette.muted, lineHeight: 20, fontWeight: '600' },
  cta: {
    marginTop: 28,
    borderRadius: 32,
    padding: 24,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
    alignItems: 'center',
  },
  ctaTitle: { fontSize: 20, fontWeight: '900', color: palette.text, textAlign: 'center' },
  ctaSub: { fontSize: 14, color: palette.muted, textAlign: 'center', marginTop: 8, maxWidth: 320 },
  ctaBtn: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.accent,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 18,
  },
  ctaBtnText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' },
})
