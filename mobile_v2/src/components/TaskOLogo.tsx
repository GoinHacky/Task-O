import { Image } from 'expo-image'
import { StyleSheet, View } from 'react-native'

import { palette } from '@/src/theme'

type Props = {
  size?: number
  rounded?: number
  noBox?: boolean
}

export function TaskOLogo({ size = 28, rounded = 14, noBox = false }: Props) {
  if (noBox) {
    return (
      <Image
        source={require('@/assets/images/task-o.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel="Task-O logo"
      />
    )
  }
  const box = size + (rounded < 14 ? 16 : 20)
  return (
    <View style={[styles.container, { width: box, height: box, borderRadius: rounded }]}>
      <Image
        source={require('@/assets/images/task-o.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel="Task-O logo"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
})
