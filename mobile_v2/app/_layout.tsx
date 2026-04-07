import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'

import { SessionProvider } from '@/src/context/SessionContext'

const authScreenOptions = { animation: 'fade' as const, animationDuration: 150, gestureEnabled: false }

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={authScreenOptions} />
          <Stack.Screen name="landing" options={authScreenOptions} />
          <Stack.Screen name="loading" options={authScreenOptions} />
          <Stack.Screen name="(auth)" options={authScreenOptions} />
          <Stack.Screen name="(drawer)" />
          <Stack.Screen name="project/[id]" />
          <Stack.Screen name="task/new" />
          <Stack.Screen name="task/[id]" />
          <Stack.Screen name="invite" />
          <Stack.Screen name="admin-support" />
        </Stack>
      </SessionProvider>
    </GestureHandlerRootView>
  )
}
