import { type Href, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/src/components/ScreenHeader'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type TeamRow = {
  id: string
  name: string
  description: string | null
  project_id: string | null
}

export default function ProjectTeamsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id: projectId } = useLocalSearchParams<{ id: string }>()
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [canAdmin, setCanAdmin] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: project } = await supabase.from('projects').select('owner_id').eq('id', projectId).single()
    const { data: mem } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user?.id || '')
      .maybeSingle()
    const isOwner = project && user && (project as { owner_id: string }).owner_id === user.id
    const isAdmin = isOwner || ['admin', 'owner'].includes((mem as { role: string } | null)?.role || '')
    setCanAdmin(!!isAdmin)

    const { data } = await supabase.from('teams').select('id, name, description, project_id').eq('project_id', projectId)
    setTeams((data || []) as TeamRow[])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  async function createTeam() {
    if (!projectId || !name.trim()) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('teams').insert({
      name: name.trim(),
      description: desc.trim() || null,
      project_id: projectId,
      owner_id: user.id,
    })
    if (error) Alert.alert('Error', error.message)
    else {
      setName('')
      setDesc('')
      load()
    }
  }

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader title="Teams" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        {canAdmin ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create team</Text>
            <TextInput style={styles.input} placeholder="Team name" value={name} onChangeText={setName} />
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Description"
              value={desc}
              onChangeText={setDesc}
              multiline
            />
            <Pressable style={styles.btn} onPress={createTeam}>
              <Text style={styles.btnText}>Create</Text>
            </Pressable>
          </View>
        ) : null}

        {teams.map(t => (
          <Pressable
            key={t.id}
            style={styles.team}
            onPress={() => router.push(`/project/${projectId}/team/${t.id}` as Href)}
          >
            <Text style={styles.teamName}>{t.name}</Text>
            {t.description ? <Text style={styles.teamDesc}>{t.description}</Text> : null}
            <Text style={styles.chev}>Open →</Text>
          </Pressable>
        ))}
        {teams.length === 0 ? <Text style={styles.empty}>No teams yet.</Text> : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  body: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: '900', marginBottom: 10, color: palette.text },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: palette.text,
    marginBottom: 10,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  btn: { backgroundColor: palette.primaryMid, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900' },
  team: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    marginBottom: 10,
  },
  teamName: { fontSize: 17, fontWeight: '900', color: palette.text },
  teamDesc: { fontSize: 13, color: palette.muted, marginTop: 6 },
  chev: { fontSize: 12, fontWeight: '800', color: palette.primaryMid, marginTop: 8 },
  empty: { textAlign: 'center', color: palette.muted, marginTop: 20, fontWeight: '600' },
})
