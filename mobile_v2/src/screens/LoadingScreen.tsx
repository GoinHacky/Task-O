import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { TaskOLogo } from '@/src/components/TaskOLogo'
import { palette } from '@/src/theme'

export default function LoadingScreen() {
  return (
    <View style={styles.wrap}>
      <TaskOLogo size={36} rounded={16} />
      <Text style={styles.markText}>Task-O</Text>
      <ActivityIndicator size="large" color={palette.primaryMid} />
      <Text style={styles.label}>Preparing your workspace...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.bg,
    gap: 14,
  },
  markText: {
    color: palette.text,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  label: {
    color: palette.muted,
    fontWeight: '600',
    fontSize: 14,
  },
})
