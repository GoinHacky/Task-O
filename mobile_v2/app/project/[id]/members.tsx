import { Redirect, useLocalSearchParams } from 'expo-router'

export default function ProjectMembersRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <Redirect href={`/project/${id}?tab=members`} />
}
