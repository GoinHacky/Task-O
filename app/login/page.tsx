'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import AuthErrorBanner from '@/components/AuthErrorBanner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'An error occurred during Google sign in')
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-white px-4 overflow-hidden relative">
      <AuthErrorBanner />

      {/* ── 3D ABSTRACT BACKGROUND ── */}

      {/* Base ambient glow — top left */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 35% 35%, rgba(0,82,204,0.12) 0%, rgba(99,179,237,0.06) 40%, transparent 70%)' }} />

      {/* Base ambient glow — bottom right */}
      <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 65% 65%, rgba(0,82,204,0.1) 0%, rgba(99,179,237,0.05) 40%, transparent 70%)' }} />

      {/* Mid ambient — center soft */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,82,204,0.04) 0%, transparent 65%)' }} />

      {/* 3D Sphere — top left large */}
      <svg className="absolute -top-20 -left-20 w-[380px] h-[380px] pointer-events-none" viewBox="0 0 380 380" fill="none">
        <defs>
          <radialGradient id="sphere1" cx="38%" cy="32%" r="60%">
            <stop offset="0%" stopColor="#5B9BF0" stopOpacity="0.28" />
            <stop offset="40%" stopColor="#0052CC" stopOpacity="0.14" />
            <stop offset="75%" stopColor="#003580" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#001F4D" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sphere1shine" cx="30%" cy="25%" r="30%">
            <stop offset="0%" stopColor="white" stopOpacity="0.18" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="190" cy="190" r="180" fill="url(#sphere1)" />
        <circle cx="190" cy="190" r="180" fill="url(#sphere1shine)" />
        <circle cx="190" cy="190" r="178" stroke="url(#sphere1)" strokeWidth="2" fill="none" strokeOpacity="0.15" />
        <ellipse cx="190" cy="190" rx="180" ry="55" stroke="#0052CC" strokeOpacity="0.05" strokeWidth="1" fill="none" />
        <ellipse cx="190" cy="190" rx="180" ry="110" stroke="#0052CC" strokeOpacity="0.04" strokeWidth="1" fill="none" />
        <ellipse cx="190" cy="190" rx="70" ry="180" stroke="#0052CC" strokeOpacity="0.04" strokeWidth="1" fill="none" />
      </svg>

      {/* 3D Sphere — bottom right large */}
      <svg className="absolute -bottom-24 -right-24 w-[420px] h-[420px] pointer-events-none" viewBox="0 0 420 420" fill="none">
        <defs>
          <radialGradient id="sphere2" cx="62%" cy="68%" r="60%">
            <stop offset="0%" stopColor="#4B8FE8" stopOpacity="0.22" />
            <stop offset="45%" stopColor="#0052CC" stopOpacity="0.1" />
            <stop offset="80%" stopColor="#002F80" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#001A4D" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sphere2shine" cx="55%" cy="62%" r="25%">
            <stop offset="0%" stopColor="white" stopOpacity="0.12" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="210" cy="210" r="200" fill="url(#sphere2)" />
        <circle cx="210" cy="210" r="200" fill="url(#sphere2shine)" />
        <ellipse cx="210" cy="210" rx="200" ry="62" stroke="#0052CC" strokeOpacity="0.05" strokeWidth="1" fill="none" />
        <ellipse cx="210" cy="210" rx="200" ry="120" stroke="#0052CC" strokeOpacity="0.04" strokeWidth="1" fill="none" />
        <ellipse cx="210" cy="210" rx="80" ry="200" stroke="#0052CC" strokeOpacity="0.04" strokeWidth="1" fill="none" />
      </svg>

      {/* 3D Ring — top right */}
      <svg className="absolute top-8 right-8 w-56 h-56 pointer-events-none" viewBox="0 0 224 224" fill="none">
        <defs>
          <radialGradient id="ring1grad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#5B9BF0" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#0052CC" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0052CC" stopOpacity="0.02" />
          </radialGradient>
        </defs>
        <circle cx="112" cy="112" r="100" stroke="url(#ring1grad)" strokeWidth="22" fill="none" />
        <path d="M 48 60 A 80 80 0 0 1 164 60" stroke="white" strokeOpacity="0.18" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M 48 165 A 80 80 0 0 0 164 165" stroke="#001F4D" strokeOpacity="0.06" strokeWidth="10" fill="none" strokeLinecap="round" />
        <circle cx="112" cy="112" r="89" stroke="#0052CC" strokeOpacity="0.07" strokeWidth="1" fill="none" />
        <circle cx="112" cy="112" r="111" stroke="#0052CC" strokeOpacity="0.05" strokeWidth="1" fill="none" />
      </svg>

      {/* 3D Ring — bottom left */}
      <svg className="absolute bottom-10 left-10 w-44 h-44 pointer-events-none" viewBox="0 0 176 176" fill="none">
        <defs>
          <radialGradient id="ring2grad" cx="62%" cy="65%" r="70%">
            <stop offset="0%" stopColor="#4B8FE8" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#0052CC" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0052CC" stopOpacity="0.01" />
          </radialGradient>
        </defs>
        <circle cx="88" cy="88" r="76" stroke="url(#ring2grad)" strokeWidth="18" fill="none" />
        <path d="M 35 52 A 62 62 0 0 1 140 52" stroke="white" strokeOpacity="0.14" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M 35 126 A 62 62 0 0 0 140 126" stroke="#001F4D" strokeOpacity="0.05" strokeWidth="8" fill="none" strokeLinecap="round" />
        <circle cx="88" cy="88" r="67" stroke="#0052CC" strokeOpacity="0.06" strokeWidth="1" fill="none" />
        <circle cx="88" cy="88" r="85" stroke="#0052CC" strokeOpacity="0.04" strokeWidth="1" fill="none" />
      </svg>

      {/* 3D floating cube — mid left */}
      <svg className="absolute left-14 top-1/3 w-20 h-20 pointer-events-none" viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7BB8F8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0052CC" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="cubeLeft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0041A3" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#0052CC" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="cubeRight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1A6AE8" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#002080" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon points="40,8 68,22 40,36 12,22" fill="url(#cubeTop)" stroke="#0052CC" strokeOpacity="0.12" strokeWidth="0.8" />
        <polygon points="12,22 40,36 40,68 12,54" fill="url(#cubeLeft)" stroke="#0052CC" strokeOpacity="0.1" strokeWidth="0.8" />
        <polygon points="40,36 68,22 68,54 40,68" fill="url(#cubeRight)" stroke="#0052CC" strokeOpacity="0.08" strokeWidth="0.8" />
        <line x1="40" y1="8" x2="68" y2="22" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
        <line x1="40" y1="8" x2="12" y2="22" stroke="white" strokeOpacity="0.14" strokeWidth="0.8" />
      </svg>

      {/* 3D floating cube — mid right */}
      <svg className="absolute right-14 bottom-1/3 w-16 h-16 pointer-events-none" viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="cube2Top" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7BB8F8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0052CC" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="cube2Left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#003A99" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0052CC" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="cube2Right" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1A6AE8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#001A66" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <polygon points="32,6 54,18 32,30 10,18" fill="url(#cube2Top)" stroke="#0052CC" strokeOpacity="0.1" strokeWidth="0.8" />
        <polygon points="10,18 32,30 32,56 10,44" fill="url(#cube2Left)" stroke="#0052CC" strokeOpacity="0.08" strokeWidth="0.8" />
        <polygon points="32,30 54,18 54,44 32,56" fill="url(#cube2Right)" stroke="#0052CC" strokeOpacity="0.07" strokeWidth="0.8" />
        <line x1="32" y1="6" x2="54" y2="18" stroke="white" strokeOpacity="0.18" strokeWidth="0.8" />
        <line x1="32" y1="6" x2="10" y2="18" stroke="white" strokeOpacity="0.12" strokeWidth="0.7" />
      </svg>

      {/* Dot grid top-right */}
      <svg className="absolute top-8 right-72 w-28 h-28 pointer-events-none" viewBox="0 0 112 112" fill="none">
        {[0, 1, 2, 3].map(row => [0, 1, 2, 3].map(col => (
          <circle key={`tr-${row}-${col}`}
            cx={col * 34 + 10} cy={row * 34 + 10}
            r="2.5" fill="#0052CC"
            fillOpacity={0.06 + (3 - row) * 0.02 + col * 0.01}
          />
        )))}
      </svg>

      {/* Dot grid bottom-left */}
      <svg className="absolute bottom-8 left-64 w-24 h-24 pointer-events-none" viewBox="0 0 96 96" fill="none">
        {[0, 1, 2, 3].map(row => [0, 1, 2, 3].map(col => (
          <circle key={`bl-${row}-${col}`}
            cx={col * 28 + 10} cy={row * 28 + 10}
            r="2.5" fill="#0052CC"
            fillOpacity={0.05 + row * 0.02}
          />
        )))}
      </svg>

      {/* ── FORM ── */}
      <div
        className={`w-full max-w-sm relative z-10 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Logo — clickable, leads to /landing */}
        <div className="text-center mb-7">
          <Link
            href="/landing"
            className="inline-flex items-center justify-center w-12 h-12 bg-[#0052CC] rounded-xl mb-4 transition-all hover:scale-105 hover:brightness-110"
            style={{ boxShadow: '0 4px 20px rgba(0,82,204,0.35), 0 1px 4px rgba(0,82,204,0.2)' }}
          >
            <Image
              src="/task-o.png"
              alt="Task-O"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your Task-O account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 relative"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(235,244,255,0.88) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,82,204,0.12), 0 2px 8px rgba(0,82,204,0.08), inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(0,82,204,0.1)',
          }}
        >
          {/* Subtle inner top highlight */}
          <div className="absolute top-0 left-6 right-6 h-px rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0052CC]/25 focus:border-[#0052CC]"
                  style={{
                    background: 'rgba(255,255,255,0.75)',
                    border: '1px solid rgba(0,82,204,0.15)',
                    boxShadow: 'inset 0 1px 3px rgba(0,82,204,0.06)',
                  }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-[#0052CC] hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
              style={{
                background: 'linear-gradient(135deg, #1A72F0 0%, #0052CC 50%, #003DA8 100%)',
                boxShadow: '0 4px 16px rgba(0,82,204,0.4), 0 1px 4px rgba(0,82,204,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>

          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(0,82,204,0.12)' }} />
            <span className="text-xs text-blue-300">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(0,82,204,0.12)' }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 text-sm font-medium text-gray-600 rounded-lg transition-all hover:text-gray-800"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(0,82,204,0.12)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </button>

        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#0052CC] font-semibold hover:underline">
            Sign up for free
          </Link>
        </p>

      </div>
    </div>
  )
}