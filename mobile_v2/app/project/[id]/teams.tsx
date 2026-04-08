import { Redirect, useLocalSearchParams } from 'expo-router'

export default function ProjectTeamsRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <Redirect href={`/project/${id}?tab=teams`} />
}
