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

export default function ProjectSettingsScreen() {
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
    if (!projectId || !name.trim() || !isOwner) return
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
    if (error) Alert.alert('Error', error.message)
    else Alert.alert('Saved', 'Project settings updated.')
  }

  async function removeProject() {
    if (!projectId || !isOwner) return
    Alert.alert('Delete project', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('projects').delete().eq('id', projectId)
          if (error) Alert.alert('Error', error.message)
          else router.replace('/(drawer)/projects' as Href)
        },
      },
    ])
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
      <ScreenHeader title="Project settings" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>General</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={[styles.input, !isOwner && styles.disabled]}
          editable={isOwner}
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multiline, !isOwner && styles.disabled]}
          multiline
          editable={isOwner}
        />
        {isOwner ? (
          <Pressable style={styles.save} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
          </Pressable>
        ) : (
          <Text style={styles.hint}>Only the owner can change project settings.</Text>
        )}

        {isOwner ? (
          <>
            <Text style={[styles.section, { marginTop: 28 }]}>Danger zone</Text>
            <Pressable style={styles.danger} onPress={removeProject}>
              <Text style={styles.dangerText}>Delete project</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  body: { padding: 16, paddingBottom: 40 },
  section: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.muted,
    marginBottom: 12,
  },
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
  disabled: { opacity: 0.6 },
  hint: { fontSize: 13, color: palette.muted, fontWeight: '600' },
  save: {
    backgroundColor: palette.primaryMid,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  danger: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  dangerText: { color: '#b91c1c', fontWeight: '900', fontSize: 15 },
})
