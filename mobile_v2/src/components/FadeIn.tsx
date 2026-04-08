import { useEffect, useRef } from 'react'
import { Animated, type ViewStyle } from 'react-native'

type Props = {
  children: React.ReactNode
  duration?: number
  style?: ViewStyle
}

export function FadeIn({ children, duration = 220, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start()
  }, [opacity, duration])

  return <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>
}
