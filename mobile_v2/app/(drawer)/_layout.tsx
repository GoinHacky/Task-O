import { Drawer } from 'expo-router/drawer'
import { CustomDrawerContent } from '@/src/components/CustomDrawerContent'

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: '80%' },
      }}
    >
      <Drawer.Screen name="dashboard" />
      <Drawer.Screen name="projects" />
      <Drawer.Screen name="inbox" />
      <Drawer.Screen name="calendar" />
      <Drawer.Screen name="settings" />
      <Drawer.Screen name="support" />
    </Drawer>
  )
}
