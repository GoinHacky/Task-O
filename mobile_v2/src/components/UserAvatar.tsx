import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { palette } from '@/src/theme'

type Props = {
  uri?: string | null
  name?: string | null
  size?: number
  style?: ViewStyle
}

export function UserAvatar({ uri, name, size = 40, style }: Props) {
  const r = size * 0.35
  const fs = size * 0.42
  const initial = (name || '?').charAt(0).toUpperCase()

  return (
    <View
      style={[
        s.wrap,
        { width: size, height: size, borderRadius: r },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={[s.img, { borderRadius: r }]} />
      ) : (
        <Text style={[s.letter, { fontSize: fs }]}>{initial}</Text>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  img: { width: '100%', height: '100%' },
  letter: { fontWeight: '900', color: palette.accent },
})
