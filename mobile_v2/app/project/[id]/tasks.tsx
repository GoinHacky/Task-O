import { Redirect, useLocalSearchParams } from 'expo-router'

export default function ProjectTasksRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <Redirect href={`/project/${id}?tab=tasks`} />
}
