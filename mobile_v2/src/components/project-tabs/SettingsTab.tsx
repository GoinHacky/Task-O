import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { FadeIn } from '@/src/components/FadeIn'
import { FormSkeleton } from '@/src/components/Skeleton'
import { supabase } from '@/src/lib/supabase'
import { palette } from '@/src/theme'

type SettingsSection = 'general' | 'danger'

export function SettingsTab({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [name, setName] = useState('')
  const [origName, setOrigName] = useState('')
  const [description, setDescription] = useState('')
  const [origDesc, setOrigDesc] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single()
    if (project) {
      const p = project as any
      setName(p.name)
      setOrigName(p.name)
      setDescription(p.description || '')
      setOrigDesc(p.description || '')
      setIsOwner(!!user && p.owner_id === user.id)
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const hasChanges = name !== origName || description !== origDesc

  async function save() {
    if (!name.trim() || !isOwner) return
    setSaving(true)
    const { error } = await supabase
      .from('projects')
      .update({ name: name.trim(), description: description.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', projectId)
    setSaving(false)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setOrigName(name.trim())
      setOrigDesc(description.trim())
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  async function removeProject() {
    if (!isOwner) return
    Alert.alert(
      'Project Deletion',
      'All data, tasks, and historical records for this project will be permanently removed. This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Project',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            const { error } = await supabase.from('projects').delete().eq('id', projectId)
            setDeleting(false)
            if (error) Alert.alert('Error', error.message)
            else router.dismissTo('/projects')
          },
        },
      ],
    )
  }

  if (loading) return <FormSkeleton />

  return (
    <FadeIn>
      <View style={s.root}>
        <Text style={s.configLabel}>Configuration</Text>
        <View style={s.tabBar}>
          <Pressable
            style={[s.tab, activeSection === 'general' && s.tabActive]}
            onPress={() => setActiveSection('general')}
          >
            <Ionicons
              name="settings-outline"
              size={16}
              color={activeSection === 'general' ? '#6366f1' : palette.muted}
            />
            <Text style={[s.tabText, activeSection === 'general' && s.tabTextActive]}>General</Text>
          </Pressable>
          <Pressable
            style={[s.tab, activeSection === 'danger' && s.tabDanger]}
            onPress={() => setActiveSection('danger')}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={activeSection === 'danger' ? '#ef4444' : palette.muted}
            />
            <Text style={[s.tabText, activeSection === 'danger' && s.tabTextDanger]}>Danger Zone</Text>
          </Pressable>
        </View>

        {activeSection === 'general' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>General Information</Text>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Project Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={[s.input, !isOwner && s.disabled]}
                editable={isOwner}
                placeholder="Project Name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Project Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[s.input, s.multi, !isOwner && s.disabled]}
                multiline
                editable={isOwner}
                placeholder="Outline the purpose and scope..."
                placeholderTextColor="#9ca3af"
              />
            </View>

            {isOwner ? (
              <View style={s.cardFooter}>
                <Pressable
                  style={[s.saveBtn, (!hasChanges || saving) && s.saveBtnDisabled]}
                  onPress={save}
                  disabled={saving || !hasChanges}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="push-outline" size={16} color="#fff" />
                      <Text style={s.saveBtnText}>
                        {success ? 'Settings Updated' : 'Push Changes'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={s.readonlyNotice}>
                <Ionicons name="lock-closed-outline" size={14} color={palette.muted} />
                <Text style={s.readonlyText}>Only the owner can change project settings.</Text>
              </View>
            )}
          </View>
        )}

        {activeSection === 'danger' && (
          <View style={s.dangerCard}>
            <View style={s.dangerGhost}>
              <Ionicons name="trash-outline" size={80} color="rgba(239,68,68,0.06)" />
            </View>

            <Text style={s.dangerTitle}>Danger Zone</Text>

            <View style={s.dangerInner}>
              <Text style={s.dangerHeading}>Project Deletion</Text>
              <Text style={s.dangerDesc}>
                All data, tasks, and historical records for this project will be permanently removed. This action is irreversible.
              </Text>

              {isOwner ? (
                <Pressable style={s.deleteBtn} onPress={removeProject} disabled={deleting}>
                  {deleting ? (
                    <ActivityIndicator color="#ef4444" size="small" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      <Text style={s.deleteBtnText}>Delete Project</Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <View style={s.readonlyNotice}>
                  <Ionicons name="lock-closed-outline" size={14} color={palette.muted} />
                  <Text style={s.readonlyText}>Only the owner can delete this project.</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </FadeIn>
  )
}

const s = StyleSheet.create({
  root: { gap: 14 },
  configLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  tabDanger: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabTextActive: { color: '#6366f1' },
  tabTextDanger: { color: '#ef4444' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 20,
    gap: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  fieldGroup: { gap: 8 },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: '#f8fafc',
    color: palette.text,
  },
  multi: { minHeight: 120, textAlignVertical: 'top' },
  disabled: { opacity: 0.5 },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 16,
    alignItems: 'flex-end',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  readonlyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  readonlyText: { fontSize: 11, fontWeight: '700', color: palette.muted, flex: 1 },

  dangerCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#fecdd3',
    padding: 20,
    gap: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  dangerGhost: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ef4444',
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  dangerInner: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#fecdd3',
    backgroundColor: 'rgba(254,242,242,0.5)',
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  dangerHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#7f1d1d',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dangerDesc: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  deleteBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ef4444',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
})
