import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native'

import { palette } from '@/src/theme'

type SkeletonProps = {
  width?: ViewStyle['width']
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

function SkeletonBlock({ width = '100%', height = 16, borderRadius = 10, style }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [pulse])

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#e2e8f0', opacity: pulse },
        style,
      ]}
    />
  )
}

export function ScreenSkeleton() {
  return (
    <View style={s.screen}>
      <SkeletonBlock width="55%" height={22} borderRadius={8} />
      <SkeletonBlock width="35%" height={14} borderRadius={6} style={{ marginTop: 10 }} />
      <SkeletonBlock height={52} borderRadius={999} style={{ marginTop: 20 }} />
      <View style={s.row}>
        <SkeletonBlock width="48%" height={90} borderRadius={20} />
        <SkeletonBlock width="48%" height={90} borderRadius={20} />
      </View>
      <View style={s.row}>
        <SkeletonBlock width="48%" height={90} borderRadius={20} />
        <SkeletonBlock width="48%" height={90} borderRadius={20} />
      </View>
      <SkeletonBlock height={140} borderRadius={24} style={{ marginTop: 8 }} />
      <SkeletonBlock height={100} borderRadius={24} style={{ marginTop: 12 }} />
    </View>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={s.cards}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={s.card}>
          <SkeletonBlock width="60%" height={14} borderRadius={6} />
          <SkeletonBlock width="90%" height={10} borderRadius={5} style={{ marginTop: 10 }} />
          <SkeletonBlock width="40%" height={10} borderRadius={5} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View style={s.list}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={s.listRow}>
          <SkeletonBlock width={40} height={40} borderRadius={12} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBlock width="70%" height={12} borderRadius={6} />
            <SkeletonBlock width="45%" height={10} borderRadius={5} />
          </View>
        </View>
      ))}
    </View>
  )
}

export function BoardSkeleton() {
  return (
    <View style={s.board}>
      {[1, 2, 3].map(i => (
        <View key={i}>
          <SkeletonBlock height={48} borderRadius={16} />
          <View style={s.boardCol}>
            <SkeletonBlock height={100} borderRadius={18} />
            <SkeletonBlock height={80} borderRadius={18} />
          </View>
        </View>
      ))}
    </View>
  )
}

export function DashboardSkeleton() {
  return (
    <View style={s.screen}>
      <SkeletonBlock width="50%" height={20} borderRadius={8} />
      <SkeletonBlock width="30%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
      <View style={[s.row, { marginTop: 20 }]}>
        <SkeletonBlock width="31%" height={80} borderRadius={18} />
        <SkeletonBlock width="31%" height={80} borderRadius={18} />
        <SkeletonBlock width="31%" height={80} borderRadius={18} />
      </View>
      <SkeletonBlock height={44} borderRadius={14} style={{ marginTop: 16 }} />
      <CardSkeleton count={4} />
    </View>
  )
}

export function FormSkeleton() {
  return (
    <View style={s.screen}>
      <SkeletonBlock width="30%" height={10} borderRadius={5} />
      <SkeletonBlock height={48} borderRadius={14} style={{ marginTop: 8 }} />
      <SkeletonBlock width="30%" height={10} borderRadius={5} style={{ marginTop: 16 }} />
      <SkeletonBlock height={100} borderRadius={14} style={{ marginTop: 8 }} />
      <SkeletonBlock height={48} borderRadius={14} style={{ marginTop: 20 }} />
    </View>
  )
}

export { SkeletonBlock }

const s = StyleSheet.create({
  screen: { padding: 16, gap: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  cards: { gap: 12, marginTop: 4 },
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  list: { gap: 16, marginTop: 4 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  board: { gap: 20, marginTop: 8 },
  boardCol: {
    marginTop: 12,
    padding: 14,
    gap: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(248,250,252,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
})
