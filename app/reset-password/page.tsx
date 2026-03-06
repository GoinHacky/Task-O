'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Check if user is actually authenticated (recovery link sets a session)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setError('Invalid or expired reset link. Please request a new one.')
            }
        }
        checkSession()
    }, [])

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        setError('')

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error
            setSuccess(true)

            // Optional: auto login or redirect after a delay
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (error: any) {
            setError(error.message || 'An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-screen flex items-center justify-center bg-white px-4 overflow-hidden relative">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 35% 35%, rgba(0,82,204,0.12) 0%, rgba(99,179,237,0.06) 40%, transparent 70%)' }} />
            <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 65% 65%, rgba(0,82,204,0.1) 0%, rgba(99,179,237,0.05) 40%, transparent 70%)' }} />

            <div
                className={`w-full max-w-sm relative z-10 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
                <div className="text-center mb-7">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-[#0052CC] rounded-xl mb-4"
                        style={{ boxShadow: '0 4px 20px rgba(0,82,204,0.35), 0 1px 4px rgba(0,82,204,0.2)' }}>
                        <Image src="/task-o.png" alt="Task-O" width={28} height={28} className="object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
                    <p className="text-gray-500 text-sm mt-1">Please enter your new security credentials</p>
                </div>

                <div className="rounded-2xl p-6 relative"
                    style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(235,244,255,0.88) 100%)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,82,204,0.12), 0 2px 8px rgba(0,82,204,0.08), inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(0,82,204,0.1)',
                    }}
                >
                    <div className="absolute top-0 left-6 right-6 h-px rounded-full"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                            {error}
                            {error.includes('expired') && (
                                <div className="mt-2 text-center text-xs">
                                    <Link href="/forgot-password" className="text-[#0052CC] font-bold hover:underline">
                                        Request a new link
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Password Updated</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                Your password has been successfully reset. You will be redirected to the login page in a few seconds.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0052CC] hover:underline"
                            >
                                Go to login <ArrowRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 pointer-events-none" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-9 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0052CC]/25 focus:border-[#0052CC]"
                                        style={{
                                            background: 'rgba(255,255,255,0.75)',
                                            border: '1px solid rgba(0,82,204,0.15)',
                                            boxShadow: 'inset 0 1px 3px rgba(0,82,204,0.06)',
                                        }}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-blue-500 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 pointer-events-none" />
                                    <input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0052CC]/25 focus:border-[#0052CC]"
                                        style={{
                                            background: 'rgba(255,255,255,0.75)',
                                            border: '1px solid rgba(0,82,204,0.15)',
                                            boxShadow: 'inset 0 1px 3px rgba(0,82,204,0.06)',
                                        }}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                                style={{
                                    background: 'linear-gradient(135deg, #1A72F0 0%, #0052CC 50%, #003DA8 100%)',
                                    boxShadow: '0 4px 16px rgba(0,82,204,0.4), 0 1px 4px rgba(0,82,204,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <span>Update Password</span>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
