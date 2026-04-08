import { Redirect, useLocalSearchParams } from 'expo-router'

export default function ProjectReportsRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <Redirect href={`/project/${id}?tab=reports`} />
}
