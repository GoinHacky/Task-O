'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Zap, Users, BarChart3, Calendar, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Stat {
  value: string | number
  label: string
}

interface LandingPageClientProps {
  stats: Stat[]
}

export default function LandingPageClient({ stats }: LandingPageClientProps) {
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

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">

      {/* ── SHARED 3D ABSTRACT BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
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
      </div>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-50"
        style={{ boxShadow: '0 1px 12px rgba(0,82,204,0.07)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
          <Link href="/landing" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#0052CC] rounded-lg flex items-center justify-center transition-all group-hover:scale-105 group-hover:brightness-110"
              style={{ boxShadow: '0 2px 10px rgba(0,82,204,0.3)' }}>
              <Image
                src="/task-o.png"
                alt="Task-O"
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
              />
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
                  Get started
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
            </div>
          </div>

          <div data-animate id="hero-img"
            className={`transition-all duration-700 delay-200 ${isVisible['hero-img'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative max-w-4xl mx-auto rounded-2xl p-1"
              style={cardStyle}>
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
            <div className="rounded-2xl px-10 py-12" style={cardStyle}>
              <p className="text-xs font-semibold text-[#0052CC] uppercase tracking-widest mb-3">Get started</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                Ready to transform how you work?
              </h2>
              <p className="text-gray-500 text-sm mb-7 leading-relaxed">
                Use Task-O to stay organized, focused, and moving fast.
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
            </div>
          </div>
        </div>
      </section>

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
                <Image
                  src="/task-o.png"
                  alt="Task-O"
                  width={16}
                  height={16}
                  className="h-4 w-4 object-contain"
                />
              </div>
              <span className="text-sm font-bold text-gray-900">Task-O</span>
            </Link>
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} Task-O. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
