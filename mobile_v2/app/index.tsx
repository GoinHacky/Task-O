import { type Href, Redirect } from 'expo-router'

import { useSession } from '@/src/context/SessionContext'
import LoadingScreen from '@/src/screens/LoadingScreen'

export default function IndexScreen() {
  const { session, loading, recoveryMode } = useSession()

  if (loading) {
    return <LoadingScreen />
  }

  if (recoveryMode && session) {
    return <Redirect href={'/reset-password' as Href} />
  }

  if (!session) {
    return <Redirect href="/landing" />
  }

  return <Redirect href="/dashboard" />
}
