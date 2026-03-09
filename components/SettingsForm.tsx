'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { User, Mail, Save, Lock, Bell, Trash2, Shield, Eye, EyeOff, Camera, Upload } from 'lucide-react'

interface SettingsFormProps {
  user: any
  userProfile?: any
}

export default function SettingsForm({ user, userProfile }: SettingsFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('general')
  const [fullName, setFullName] = useState(userProfile?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    mentions: true,
    taskUpdates: true
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setError('')

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      setSuccess('Avatar uploaded successfully! Don\'t forget to save changes.')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (activeTab === 'general') {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            full_name: fullName,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (updateError) throw updateError
      } else if (activeTab === 'password') {
        if (!currentPassword) {
          throw new Error('Current password is required')
        }
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }

        // Verify current password first
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        })

        if (signInError) {
          throw new Error('Incorrect current password')
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (passwordError) throw passwordError
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else if (activeTab === 'notifications') {
        // Here you would typically save to a preferences table
        setSuccess('Notification preferences saved locally!')
        setLoading(false)
        return
      }

      setSuccess('Settings updated successfully!')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
      setError('Account deactivation is currently handled by administration for security reasons.')
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'deactivation', label: 'Deactivation', icon: Trash2, danger: true },
  ]

  return (
    <div className="flex flex-col md:flex-row gap-4 min-h-[600px] p-2 md:p-4">
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 bg-gray-50/50 dark:bg-slate-950/20 p-4 rounded-[40px] border border-gray-100/50 dark:border-slate-800/30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setError('')
              setSuccess('')
            }}
            className={`flex items-center gap-4 px-5 py-4 rounded-3xl text-sm font-black transition-all group ${activeTab === tab.id
              ? tab.danger
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-white dark:bg-slate-800 text-[#6366f1] shadow-xl shadow-indigo-100/20 dark:shadow-none ring-1 ring-gray-100 dark:ring-slate-700'
              : 'text-gray-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
          >
            <tab.icon size={20} className={`${activeTab === tab.id ? '' : 'group-hover:scale-110 transition-transform'}`} />
            <span className="tracking-tight">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold animate-in zoom-in duration-200">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-2xl text-green-700 dark:text-green-400 text-xs font-bold animate-in zoom-in duration-200">
              {success}
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-10">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-slate-50 tracking-tightest mb-2">General Settings</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">Update your identification and presence</p>
              </div>

              {/* Avatar Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-10 p-8 bg-gray-50/50 dark:bg-slate-950/20 rounded-[40px] border border-gray-100 dark:border-slate-800/50 backdrop-blur-xl group/avatar">
                <div className="relative">
                  <div className="w-32 h-32 rounded-[40px] bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-2xl dark:shadow-none overflow-hidden flex items-center justify-center text-[#6366f1] text-4xl font-black ring-1 ring-gray-100 dark:ring-slate-700 transition-transform group-hover/avatar:scale-105 duration-500">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      fullName?.[0] || user?.email?.[0]
                    )}
                  </div>
                  <label className="absolute -bottom-3 -right-3 w-12 h-12 bg-[#6366f1] text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-gray-50 dark:border-slate-900 cursor-pointer hover:bg-[#5558e3] transition-all hover:scale-110 active:scale-90 z-10">
                    <Camera size={20} />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-sm font-black text-gray-900 dark:text-slate-50 mb-2 uppercase tracking-widest">Workspace Avatar</h4>
                  <p className="text-xs text-gray-400 dark:text-slate-500 font-medium italic mb-6 leading-relaxed max-w-xs">
                    This image will be shown alongside your tasks and messages.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start">
                    <label className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm ring-1 ring-gray-200 dark:ring-transparent">
                      <Upload size={16} className="text-[#6366f1]" />
                      {uploading ? 'Uploading...' : 'Upload New'}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                    </label>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-4 py-2 text-gray-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-300 dark:text-slate-600 group-focus-within:text-[#6366f1] transition-colors">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800/50 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-semibold text-gray-900 dark:text-slate-100 shadow-inner"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                  <div className="relative group opacity-60">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-300 dark:text-slate-600">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-2xl text-sm font-semibold text-gray-500 dark:text-slate-400 cursor-not-allowed shadow-inner"
                    />
                  </div>
                  <p className="mt-1.5 ml-1 text-[10px] text-gray-400 dark:text-slate-500 font-medium italic">Email is used for sign-in and cannot be changed.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="space-y-10">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-slate-50 tracking-tightest mb-2">Update Password</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">Secure your account with a unique passphrase</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Current Password</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-300 dark:text-slate-600 group-focus-within:text-[#6366f1] transition-colors">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800/50 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-semibold text-gray-900 dark:text-slate-100 shadow-inner"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-300 dark:text-slate-600 group-focus-within:text-[#6366f1] transition-colors">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800/50 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-semibold text-gray-900 dark:text-slate-100 shadow-inner"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-300 dark:text-slate-600 group-focus-within:text-[#6366f1] transition-colors">
                      <Shield size={16} />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800/50 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#6366f1]/10 focus:border-[#6366f1] outline-none transition-all text-sm font-semibold text-gray-900 dark:text-slate-100 shadow-inner"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-10">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-slate-50 tracking-tightest mb-2">Notifications</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">Control how Task-O reaches out to you</p>
              </div>
              <div className="space-y-4">
                {[
                  { id: 'email', label: 'Email Notifications', desc: 'Receive project updates via email' },
                  { id: 'push', label: 'Browser Push Notifications', desc: 'Receive real-time alerts in your browser' },
                  { id: 'mentions', label: 'Mentions Only', desc: 'Only notify when someone mentions you' },
                  { id: 'taskUpdates', label: 'Task Activity', desc: 'Notify when tasks are moved or updated' }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800/50 backdrop-blur-xl">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{item.label}</p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium italic">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={(notifications as any)[item.id]}
                        onChange={(e) => setNotifications({ ...notifications, [item.id]: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none ring-offset-white dark:ring-offset-slate-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366f1]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'deactivation' && (
            <div className="space-y-6 animate-in slide-in-from-top-2">
              <div className="p-6 bg-red-50 dark:bg-red-500/10 rounded-[32px] border border-red-100 dark:border-red-500/20 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Delete Account</h3>
                <p className="text-sm text-red-500 dark:text-red-400/80 font-medium opacity-80 dark:opacity-100 leading-relaxed mb-6">
                  Warning: Deleting your account is permanent. All your projects, tasks, and data will be permanently removed. This action cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-8 py-3 bg-red-600 text-white text-xs font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 uppercase tracking-widest"
                >
                  Confirm Deactivation
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'deactivation' && (
            <div className="flex justify-end pt-4 border-t border-gray-50 dark:border-slate-800/50">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-8 py-3 bg-[#6366f1] text-white text-xs font-bold rounded-2xl hover:bg-[#5558e3] disabled:opacity-50 transition-all shadow-lg shadow-[#6366f1]/20 active:scale-95 uppercase tracking-widest"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

