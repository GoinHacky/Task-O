import { Stack } from 'expo-router'

export default function DrawerMainStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 220,
        gestureEnabled: false,
      }}
    />
  )
}
