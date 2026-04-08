import { Redirect, useLocalSearchParams } from 'expo-router'

export default function ProjectSettingsRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <Redirect href={`/project/${id}?tab=settings`} />
}
