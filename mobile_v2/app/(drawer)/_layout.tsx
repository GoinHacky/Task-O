import { Drawer } from 'expo-router/drawer'
import { usePathname } from 'expo-router'
import { CustomDrawerContent } from '@/src/components/CustomDrawerContent'

export default function DrawerLayout() {
  const pathname = usePathname()

  // Enable swipe-to-open only for the drawer's top-level screens.
  // Keep it disabled for nested/detail screens (e.g. /project/*, /task/*, etc.).
  const swipeEnabled = [
    '/dashboard',
    '/projects',
    '/tasks',
    '/calendar',
    '/inbox',
    '/notifications',
    '/kanban',
    '/reports',
    '/settings',
    '/support',
  ].includes(pathname)

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: '80%' },
        swipeEnabled,
      }}
    >
      <Drawer.Screen name="(stack)" options={{ headerShown: false }} />
    </Drawer>
  )
}
