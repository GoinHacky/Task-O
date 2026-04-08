import * as Linking from 'expo-linking'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { applyAuthDeepLink } from '@/src/lib/authDeepLink'
import { palette } from '@/src/theme'

export default function AuthCallback() {
  const [done, setDone] = useState(false)

  useEffect(() => {
    let mounted = true
    async function run() {
      const url = await Linking.getInitialURL()
      if (url) {
        await applyAuthDeepLink(url)
      }
      if (mounted) setDone(true)
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  if (done) return <Redirect href="/dashboard" />

  return (
    <View style={s.safe}>
      <ActivityIndicator color={palette.primary} />
      <Text style={s.text}>Signing you in…</Text>
    </View>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg, gap: 10 },
  text: { fontSize: 13, fontWeight: '700', color: palette.muted },
})

