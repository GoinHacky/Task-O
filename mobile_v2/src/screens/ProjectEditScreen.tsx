import { useLocalSearchParams, useRouter } from 'expo-router'
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

export default function ProjectEditScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id: projectId } = useLocalSearchParams<{ id: string }>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single()
    if (project) {
      const p = project as { name: string; description: string | null; owner_id: string }
      setName(p.name)
      setDescription(p.description || '')
      setIsOwner(!!user && p.owner_id === user.id)
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  async function save() {
    if (!projectId || !name.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('projects')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
    setSaving(false)
    if (error) Alert.alert('Could not save', error.message)
    else router.back()
  }

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.primaryMid} />
      </View>
    )
  }

  if (!isOwner) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <ScreenHeader title="Edit project" onBack={() => router.back()} />
        <Text style={styles.denied}>Only the project owner can edit details.</Text>
      </View>
    )
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScreenHeader title="Edit project" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multiline]}
          multiline
        />
        <Pressable style={styles.save} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  denied: { padding: 24, fontSize: 15, color: palette.muted, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 40 },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.muted,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    color: palette.text,
    backgroundColor: palette.surface,
    marginBottom: 14,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  save: {
    backgroundColor: palette.primaryMid,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 15 },
})
