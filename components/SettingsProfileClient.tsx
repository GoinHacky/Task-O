'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
    User,
    Mail,
    Camera,
    Upload,
    ChevronRight,
    Settings as SettingsIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface SettingsProfileClientProps {
    user: any
    userProfile?: any
}

export default function SettingsProfileClient({ user, userProfile }: SettingsProfileClientProps) {
    const router = useRouter()

    // Profile State
    const [fullName, setFullName] = useState(userProfile?.full_name || '')
    const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || '')
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            setMessage(null)

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
            setMessage({ type: 'success', text: 'Avatar uploaded! Click Save Changes to update your profile.' })
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setUploading(false)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)

            if (error) throw error
            setMessage({ type: 'success', text: 'Profile updated successfully!' })
            router.refresh()
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-gray-200 dark:border-slate-800 shadow-xl shadow-gray-100/50 dark:shadow-none min-h-[600px] overflow-hidden flex flex-col">

                {message && (
                    <div className={`p-10 py-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'} border-b font-bold text-xs flex items-center gap-3 animate-in slide-in-from-top duration-300`}>
                        <div className={`w-6 h-6 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white flex items-center justify-center shrink-0`}>
                            {message.type === 'success' ? '✓' : '!'}
                        </div>
                        {message.text}
                    </div>
                )}

                <div className="p-10 md:p-14 flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="mb-10">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tightest mb-2">My Profile</h1>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">Manage your identity and appearance</p>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-10">
                        {/* Avatar Section */}
                        <div className="flex flex-col sm:flex-row items-center gap-10">
                            <div className="relative group/avatar">
                                <div className="w-32 h-32 rounded-[40px] bg-slate-50 dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-2xl dark:shadow-none overflow-hidden flex items-center justify-center text-[#0077B6] text-4xl font-black ring-1 ring-gray-100 dark:ring-slate-700 group-hover/avatar:scale-105 transition-all duration-500">
                                    {avatarUrl ? (
                                        <Image src={avatarUrl} alt="Avatar" width={128} height={128} className="w-full h-full object-cover" />
                                    ) : (
                                        fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()
                                    )}
                                </div>
                                <label className="absolute -bottom-3 -right-3 w-12 h-12 bg-[#0077B6] text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-white dark:border-slate-900 cursor-pointer hover:bg-[#005f91] transition-all hover:rotate-6 active:scale-90 z-10">
                                    <Camera size={20} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                                </label>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-2 uppercase tracking-widest">Workspace Avatar</h4>
                                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium italic mb-6 leading-relaxed max-w-xs">
                                    Recommended size: 400x400px. JPG, PNG or GIF.
                                </p>
                                <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start">
                                    <label className="flex items-center gap-3 px-6 py-3 bg-[#f3f4ff] dark:bg-indigo-500/10 text-[#0077B6] rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-100 dark:hover:bg-indigo-500/20 transition-all border border-indigo-100 dark:border-indigo-500/20">
                                        <Upload size={16} />
                                        {uploading ? 'Uploading...' : 'Upload New'}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                                    </label>
                                    {avatarUrl && (
                                        <button type="button" onClick={() => setAvatarUrl('')} className="text-gray-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all">
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300 dark:text-slate-600 group-focus-within:text-[#0077B6] transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-950/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm font-bold text-gray-900 dark:text-white shadow-inner focus:ring-4 focus:ring-[#0077B6]/5 focus:border-[#0077B6]"
                                        placeholder="e.g. Kenneth"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group opacity-60">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300 dark:text-slate-600">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full pl-12 pr-4 py-4 bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold text-gray-500 dark:text-slate-400 cursor-not-allowed shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-10 py-4 bg-[#0077B6] text-white text-[11px] font-black rounded-[20px] hover:bg-[#005f91] disabled:opacity-50 transition-all shadow-xl shadow-blue-500/20 active:scale-95 uppercase tracking-widest flex items-center gap-3"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
                                        <ChevronRight size={14} />
                                    </div>
                                )}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
