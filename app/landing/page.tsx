'use client'

import Link from 'next/link'
import { CheckCircle, Zap, Users, BarChart3, Calendar, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const inputStyle = {
    background: 'rgba(255,255,255,0.75)',
    border: '1px solid rgba(0,82,204,0.15)',
    boxShadow: 'inset 0 1px 3px rgba(0,82,204,0.06)',
  }

  const cardStyle = {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(235,244,255,0.88) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,82,204,0.10), 0 2px 8px rgba(0,82,204,0.06), inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(0,82,204,0.09)',
  }

  const features = [
    { icon: CheckCircle, title: 'Task Management', desc: 'Create, assign, and track tasks effortlessly. Stay on top of everything with smart prioritization.', color: '#0052CC' },
    { icon: Calendar, title: 'Timeline View', desc: 'Visualize project timelines and dependencies. Plan ahead with confidence and clarity.', color: '#0052CC' },
    { icon: Users, title: 'Team Collaboration', desc: 'Work together seamlessly with real-time updates, comments, and shared workspaces.', color: '#0052CC' },
    { icon: BarChart3, title: 'Progress Tracking', desc: 'Monitor project health with beautiful dashboards and insightful custom reports.', color: '#0052CC' },
    { icon: Zap, title: 'Automations', desc: 'Automate repetitive tasks and free up time to focus on what truly matters.', color: '#0052CC' },
    { icon: CheckCircle, title: 'Integrations', desc: 'Connect with your favorite tools and streamline your entire workflow in one place.', color: '#0052CC' },
  ]

  const stats = [
    { value: '10,000+', label: 'Active Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '50M+', label: 'Tasks Done' },
    { value: '150+', label: 'Countries' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">

      {/* ── SHARED 3D ABSTRACT BACKGROUND (fixed, subtle) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px]"
          style={{ background: 'radial-gradient(ellipse at 35% 35%, rgba(0,82,204,0.09) 0%, rgba(99,179,237,0.04) 45%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-[640px] h-[640px]"
          style={{ background: 'radial-gradient(ellipse at 65% 65%, rgba(0,82,204,0.07) 0%, rgba(99,179,237,0.03) 45%, transparent 70%)' }} />

        {/* 3D Sphere top-left */}
        <svg className="absolute -top-24 -left-24 w-[400px] h-[400px]" viewBox="0 0 400 400" fill="none">
          <defs>
            <radialGradient id="l-sph1" cx="38%" cy="32%" r="60%">
              <stop offset="0%" stopColor="#5B9BF0" stopOpacity="0.2" />
              <stop offset="45%" stopColor="#0052CC" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#001F4D" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="l-sph1s" cx="30%" cy="25%" r="30%">
              <stop offset="0%" stopColor="white" stopOpacity="0.14" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="190" fill="url(#l-sph1)" />
          <circle cx="200" cy="200" r="190" fill="url(#l-sph1s)" />
          <ellipse cx="200" cy="200" rx="190" ry="58" stroke="#0052CC" strokeOpacity="0.04" strokeWidth="1" fill="none" />
          <ellipse cx="200" cy="200" rx="75" ry="190" stroke="#0052CC" strokeOpacity="0.03" strokeWidth="1" fill="none" />
        </svg>

        {/* 3D Sphere bottom-right */}
        <svg className="absolute -bottom-28 -right-28 w-[440px] h-[440px]" viewBox="0 0 440 440" fill="none">
          <defs>
            <radialGradient id="l-sph2" cx="62%" cy="68%" r="60%">
              <stop offset="0%" stopColor="#4B8FE8" stopOpacity="0.16" />
              <stop offset="50%" stopColor="#0052CC" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#001A4D" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="220" cy="220" r="208" fill="url(#l-sph2)" />
          <ellipse cx="220" cy="220" rx="208" ry="65" stroke="#0052CC" strokeOpacity="0.04" strokeWidth="1" fill="none" />
          <ellipse cx="220" cy="220" rx="82" ry="208" stroke="#0052CC" strokeOpacity="0.03" strokeWidth="1" fill="none" />
        </svg>

        {/* 3D Ring top-right */}
        <svg className="absolute top-10 right-10 w-56 h-56" viewBox="0 0 224 224" fill="none">
          <defs>
            <radialGradient id="l-ring1" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#5B9BF0" stopOpacity="0.16" />
              <stop offset="60%" stopColor="#0052CC" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#0052CC" stopOpacity="0.01" />
            </radialGradient>
          </defs>
          <circle cx="112" cy="112" r="100" stroke="url(#l-ring1)" strokeWidth="20" fill="none" />
          <path d="M 48 60 A 80 80 0 0 1 164 60" stroke="white" strokeOpacity="0.14" strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M 48 165 A 80 80 0 0 0 164 165" stroke="#001F4D" strokeOpacity="0.05" strokeWidth="9" fill="none" strokeLinecap="round" />
        </svg>

        {/* 3D Ring bottom-left */}
        <svg className="absolute bottom-10 left-10 w-44 h-44" viewBox="0 0 176 176" fill="none">
          <defs>
            <radialGradient id="l-ring2" cx="62%" cy="65%" r="70%">
              <stop offset="0%" stopColor="#4B8FE8" stopOpacity="0.13" />
              <stop offset="60%" stopColor="#0052CC" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#0052CC" stopOpacity="0.01" />
            </radialGradient>
          </defs>
          <circle cx="88" cy="88" r="76" stroke="url(#l-ring2)" strokeWidth="17" fill="none" />
          <path d="M 35 52 A 62 62 0 0 1 140 52" stroke="white" strokeOpacity="0.12" strokeWidth="7" fill="none" strokeLinecap="round" />
        </svg>

        {/* Isometric cube left */}
        <svg className="absolute left-16 top-1/3 w-16 h-16" viewBox="0 0 80 80" fill="none">
          <defs>
            <linearGradient id="l-ct" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7BB8F8" stopOpacity="0.17" />
              <stop offset="100%" stopColor="#0052CC" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="l-cl" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0041A3" stopOpacity="0.11" />
              <stop offset="100%" stopColor="#0052CC" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="l-cr" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1A6AE8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#002080" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <polygon points="40,8 68,22 40,36 12,22" fill="url(#l-ct)" stroke="#0052CC" strokeOpacity="0.1" strokeWidth="0.8" />
          <polygon points="12,22 40,36 40,68 12,54" fill="url(#l-cl)" stroke="#0052CC" strokeOpacity="0.08" strokeWidth="0.8" />
          <polygon points="40,36 68,22 68,54 40,68" fill="url(#l-cr)" stroke="#0052CC" strokeOpacity="0.07" strokeWidth="0.8" />
          <line x1="40" y1="8" x2="68" y2="22" stroke="white" strokeOpacity="0.18" strokeWidth="1" />
          <line x1="40" y1="8" x2="12" y2="22" stroke="white" strokeOpacity="0.12" strokeWidth="0.8" />
        </svg>

        {/* Isometric cube right */}
        <svg className="absolute right-16 bottom-1/3 w-14 h-14" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="l-c2t" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7BB8F8" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#0052CC" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="l-c2l" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#003A99" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#0052CC" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="l-c2r" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1A6AE8" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#001A66" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          <polygon points="32,6 54,18 32,30 10,18" fill="url(#l-c2t)" stroke="#0052CC" strokeOpacity="0.09" strokeWidth="0.8" />
          <polygon points="10,18 32,30 32,56 10,44" fill="url(#l-c2l)" stroke="#0052CC" strokeOpacity="0.07" strokeWidth="0.8" />
          <polygon points="32,30 54,18 54,44 32,56" fill="url(#l-c2r)" stroke="#0052CC" strokeOpacity="0.06" strokeWidth="0.8" />
          <line x1="32" y1="6" x2="54" y2="18" stroke="white" strokeOpacity="0.15" strokeWidth="0.8" />
        </svg>

        {/* Dot grid top-right */}
        <svg className="absolute top-10 right-72 w-24 h-24" viewBox="0 0 96 96" fill="none">
          {[0, 1, 2, 3].map(row => [0, 1, 2, 3].map(col => (
            <circle key={`${row}-${col}`} cx={col * 28 + 10} cy={row * 28 + 10} r="2.5"
              fill="#0052CC" fillOpacity={0.05 + (3 - row) * 0.015} />
          )))}
        </svg>

        {/* Dot grid bottom-left */}
        <svg className="absolute bottom-10 left-56 w-20 h-20" viewBox="0 0 80 80" fill="none">
          {[0, 1, 2, 3].map(row => [0, 1, 2, 3].map(col => (
            <circle key={`${row}-${col}`} cx={col * 24 + 8} cy={row * 24 + 8} r="2.5"
              fill="#0052CC" fillOpacity={0.04 + row * 0.012} />
          )))}
        </svg>
      </div>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-50"
        style={{ boxShadow: '0 1px 12px rgba(0,82,204,0.07)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
          <Link href="/landing" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#0052CC] rounded-lg flex items-center justify-center transition-all group-hover:scale-105 group-hover:brightness-110"
              style={{ boxShadow: '0 2px 10px rgba(0,82,204,0.3)' }}>
              <img src="/task-o.png" alt="Task-O" className="h-5 w-5 object-contain" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Task-O</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Solutions'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-gray-500 hover:text-[#0052CC] transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login"
              className="text-sm font-medium text-gray-600 hover:text-[#0052CC] px-4 py-2 rounded-lg transition-colors">
              Log in
            </Link>
            <Link href="/signup"
              className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #1A72F0 0%, #0052CC 50%, #003DA8 100%)',
                boxShadow: '0 3px 12px rgba(0,82,204,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-20 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14"
            data-animate id="hero-text">
            <div className={`transition-all duration-700 ${isVisible['hero-text'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.92), rgba(235,244,255,0.88))',
                  border: '1px solid rgba(0,82,204,0.15)',
                  boxShadow: '0 2px 8px rgba(0,82,204,0.08)',
                  color: '#0052CC',
                }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC] animate-pulse" />
                Trusted by 10,000+ teams worldwide
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-[1.1] tracking-tight">
                A smarter way to{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #1A72F0, #0052CC)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  get work done
                </span>
              </h1>

              <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-xl mx-auto">
                Plan, track, and collaborate on all your work — projects, tasks, and goals — beautifully organized in one place.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/signup"
                  className="group flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-lg transition-all hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, #1A72F0 0%, #0052CC 50%, #003DA8 100%)',
                    boxShadow: '0 4px 16px rgba(0,82,204,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}>
                  Get started for free
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/login"
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 px-6 py-3 rounded-lg transition-all hover:text-[#0052CC]"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.92), rgba(235,244,255,0.88))',
                    border: '1px solid rgba(0,82,204,0.12)',
                    boxShadow: '0 2px 8px rgba(0,82,204,0.06)',
                  }}>
                  Sign in to your account
                </Link>
              </div>

              <p className="text-xs text-gray-400 mt-4">No credit card required · Free forever on basic plan</p>
            </div>
          </div>

          {/* Hero dashboard mockup */}
          <div data-animate id="hero-img"
            className={`transition-all duration-700 delay-200 ${isVisible['hero-img'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative max-w-4xl mx-auto rounded-2xl p-1"
              style={cardStyle}>
              {/* Top bar chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b"
                style={{ borderColor: 'rgba(0,82,204,0.08)' }}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-70" />
                <div className="flex-1 mx-4">
                  <div className="h-5 rounded-md w-48 mx-auto flex items-center justify-center"
                    style={{ background: 'rgba(0,82,204,0.06)' }}>
                    <span className="text-[10px] text-blue-400 font-medium">app.task-o.com/dashboard</span>
                  </div>
                </div>
              </div>
              {/* Mock board content */}
              <div className="p-5 grid grid-cols-3 gap-3">
                {[
                  { title: 'To Do', color: 'bg-gray-200', tasks: ['Research competitors', 'Draft proposal', 'Review designs'] },
                  { title: 'In Progress', color: 'bg-blue-400', tasks: ['API integration', 'Write docs', 'QA testing'] },
                  { title: 'Done', color: 'bg-green-400', tasks: ['Setup repo', 'Design mockups', 'Team onboarding'] },
                ].map((col, ci) => (
                  <div key={ci} className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${col.color}`} />
                      <span className="text-xs font-semibold text-gray-600">{col.title}</span>
                      <span className="ml-auto text-xs text-gray-400">{col.tasks.length}</span>
                    </div>
                    {col.tasks.map((task, ti) => (
                      <div key={ti} className="px-3 py-2.5 rounded-xl text-xs text-gray-700 font-medium"
                        style={{
                          background: 'rgba(255,255,255,0.8)',
                          border: '1px solid rgba(0,82,204,0.08)',
                          boxShadow: '0 1px 4px rgba(0,82,204,0.05)',
                        }}>
                        {task}
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-300 to-blue-500" />
                          <div className="h-1.5 rounded-full flex-1" style={{ background: 'rgba(0,82,204,0.1)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Floating notification cards */}
            <div className="absolute -left-4 top-1/3 hidden lg:block">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                style={{ ...cardStyle, boxShadow: '0 8px 24px rgba(0,82,204,0.14)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,82,204,0.1)' }}>
                  <CheckCircle className="h-4 w-4 text-[#0052CC]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Task completed</p>
                  <p className="text-[10px] text-blue-400">2 minutes ago</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-1/3 hidden lg:block">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                style={{ ...cardStyle, boxShadow: '0 8px 24px rgba(0,82,204,0.14)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,82,204,0.1)' }}>
                  <Calendar className="h-4 w-4 text-[#0052CC]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">3 tasks due today</p>
                  <p className="text-[10px] text-blue-400">Stay on track</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center"
            style={cardStyle}>
            {stats.map((s, i) => (
              <div key={i} data-animate id={`stat-${i}`}
                className={`transition-all duration-700 ${isVisible[`stat-${i}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${i * 80}ms` }}>
                <p className="text-2xl font-bold"
                  style={{ background: 'linear-gradient(135deg, #1A72F0, #0052CC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12" data-animate id="feat-title">
            <div className={`transition-all duration-700 ${isVisible['feat-title'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <p className="text-xs font-semibold text-[#0052CC] uppercase tracking-widest mb-3">Features</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                Everything your team needs
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
                Powerful tools built to help you collaborate, plan, and achieve goals faster than ever before.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} data-animate id={`feat-${i}`}
                className={`transition-all duration-700 ${isVisible[`feat-${i}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="rounded-2xl p-6 h-full group hover:scale-[1.02] transition-transform"
                  style={cardStyle}>
                  <div className="absolute top-0 left-6 right-6 h-px rounded-full"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: 'linear-gradient(135deg, #1A72F0, #0052CC)',
                      boxShadow: '0 4px 12px rgba(0,82,204,0.3)',
                    }}>
                    <f.icon className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="solutions" className="relative z-10 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center" data-animate id="cta">
          <div className={`transition-all duration-700 ${isVisible['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="rounded-2xl px-10 py-12"
              style={cardStyle}>
              <div className="absolute top-0 left-10 right-10 h-px rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />
              <p className="text-xs font-semibold text-[#0052CC] uppercase tracking-widest mb-3">Get started</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                Ready to transform how you work?
              </h2>
              <p className="text-gray-500 text-sm mb-7 leading-relaxed">
                Join thousands of teams already using Task-O to stay organized, focused, and moving fast.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/signup"
                  className="flex items-center gap-2 text-sm font-semibold text-white px-6 py-2.5 rounded-lg transition-all hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, #1A72F0 0%, #0052CC 50%, #003DA8 100%)',
                    boxShadow: '0 4px 16px rgba(0,82,204,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}>
                  Create free account
                </Link>
                <Link href="/login"
                  className="text-sm font-medium text-[#0052CC] px-6 py-2.5 rounded-lg transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(0,82,204,0.12)',
                  }}>
                  Sign in
                </Link>
              </div>
              <p className="text-xs text-gray-400 mt-4">No credit card · Free forever on basic</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t mt-4" style={{ borderColor: 'rgba(0,82,204,0.08)' }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {[
              { heading: 'Product', links: ['Features', 'Integrations', 'Changelog'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers'] },
              { heading: 'Resources', links: ['Docs', 'Help Center', 'Templates'] },
              { heading: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
            ].map((col) => (
              <div key={col.heading}>
                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">{col.heading}</p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-xs text-gray-400 hover:text-[#0052CC] transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t gap-4"
            style={{ borderColor: 'rgba(0,82,204,0.07)' }}>
            <Link href="/landing" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#0052CC] rounded-lg flex items-center justify-center"
                style={{ boxShadow: '0 2px 8px rgba(0,82,204,0.25)' }}>
                <img src="/task-o.png" alt="Task-O" className="h-4 w-4 object-contain" />
              </div>
              <span className="text-sm font-bold text-gray-900">Task-O</span>
            </Link>
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} Task-O. All rights reserved.</p>
            <div className="flex items-center gap-5">
              {['Twitter', 'LinkedIn', 'GitHub'].map((s) => (
                <a key={s} href="#" className="text-xs text-gray-400 hover:text-[#0052CC] transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}