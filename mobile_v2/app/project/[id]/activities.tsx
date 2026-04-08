import { Redirect, useLocalSearchParams } from 'expo-router'

export default function ProjectActivitiesRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <Redirect href={`/project/${id}?tab=activity`} />
}
