'use client'

import { useState } from 'react'
import {
    X,
    ChevronRight,
    ChevronLeft,
    LayoutDashboard,
    FolderKanban,
    Calendar,
    Users,
    CheckCircle2,
    Play,
    Users2,
    Briefcase,
    UserPlus
} from 'lucide-react'
import { useGuidedTour } from '@/components/GuidedTour'

interface TutorialModalProps {
    isOpen: boolean
    onClose: () => void
}

const slides = [
    {
        title: "Welcome to Task-O",
        description: "The ultimate platform for professional task and project management. Let's take a quick tour of the key features to get you started.",
        icon: <Play size={48} className="text-indigo-500" />,
        color: "bg-indigo-50 dark:bg-indigo-500/10"
    },
    {
        title: "Unified Dashboard",
        description: "Monitor all your activities in one place. Get a high-level overview of your project's health, upcoming deadlines, and team performance.",
        icon: <LayoutDashboard size={48} className="text-blue-500" />,
        color: "bg-blue-50 dark:bg-blue-500/10"
    },
    {
        title: "Kanban Boards",
        description: "Manage tasks with ease using our intuitive drag-and-drop Kanban boards. Organize workflows, assign tasks, and track progress visually.",
        icon: <FolderKanban size={48} className="text-orange-500" />,
        color: "bg-orange-50 dark:bg-orange-500/10"
    },
    {
        title: "Interactive Calendar",
        description: "Never miss a deadline again. Visualize your project schedule and manage important dates with our seamless calendar integration.",
        icon: <Calendar size={48} className="text-emerald-500" />,
        color: "bg-emerald-50 dark:bg-emerald-500/10"
    },
    {
        title: "Team Collaboration",
        description: "Invite your team members, share projects, and collaborate in real-time. Task-O makes it easy to stay synced with your colleagues.",
        icon: <Users size={48} className="text-purple-500" />,
        color: "bg-purple-50 dark:bg-purple-500/10"
    },
    {
        title: "Ready to Start?",
        description: "You're all set! Start creating projects and tasks to experience the full power of Task-O.",
        icon: <CheckCircle2 size={48} className="text-pink-500" />,
        color: "bg-pink-50 dark:bg-pink-500/10"
    }
]

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [selectedTour, setSelectedTour] = useState<string | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)

    const { startTour } = useGuidedTour()

    if (!isOpen) return null

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1)
        } else {
            if (!selectedTour) {
                setShowPrompt(true)
                return
            }
            startTour(selectedTour)
            handleClose()
        }
    }

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1)
        }
    }

    const handleClose = () => {
        setCurrentSlide(0)
        setSelectedTour(null)
        setShowPrompt(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={handleClose}
            />

            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-gray-500 transition-colors z-20"
                >
                    <X size={20} />
                </button>

                <div className="p-10 text-center">
                    <div className={`w-24 h-24 rounded-3xl ${slides[currentSlide].color} flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-500`}>
                        {slides[currentSlide].icon}
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tightest">
                        {slides[currentSlide].title}
                    </h2>

                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium leading-relaxed mb-10 min-h-[60px]">
                        {slides[currentSlide].description}
                    </p>

                    {currentSlide === slides.length - 1 ? (
                        <div className="flex flex-col items-center mb-8">
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={() => {
                                        setSelectedTour('create-project')
                                        setShowPrompt(false)
                                    }}
                                    className={`p-4 rounded-[24px] border transition-all group text-left ${selectedTour === 'create-project' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20 ring-2 ring-blue-500/20' : 'border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 hover:border-blue-500'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform ${selectedTour === 'create-project' ? 'bg-blue-500 text-white scale-110' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-500 group-hover:scale-110'}`}>
                                        <FolderKanban size={16} />
                                    </div>
                                    <h4 className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Create Project</h4>
                                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Guided Walkthrough</p>
                                </button>

                                <button
                                    onClick={() => {
                                        setSelectedTour('add-team-members')
                                        setShowPrompt(false)
                                    }}
                                    className={`p-4 rounded-[24px] border transition-all group text-left ${selectedTour === 'add-team-members' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/20 ring-2 ring-orange-500/20' : 'border-orange-100 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-500/5 hover:border-orange-500'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform ${selectedTour === 'add-team-members' ? 'bg-orange-500 text-white scale-110' : 'bg-orange-100 dark:bg-orange-500/10 text-orange-500 group-hover:scale-110'}`}>
                                        <UserPlus size={16} />
                                    </div>
                                    <h4 className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Invite Members</h4>
                                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Guided Walkthrough</p>
                                </button>

                                <button
                                    onClick={() => {
                                        setSelectedTour('create-team')
                                        setShowPrompt(false)
                                    }}
                                    className={`p-4 rounded-[24px] border transition-all group text-left ${selectedTour === 'create-team' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 ring-2 ring-indigo-500/20' : 'border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 hover:border-indigo-500'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform ${selectedTour === 'create-team' ? 'bg-indigo-500 text-white scale-110' : 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-500 group-hover:scale-110'}`}>
                                        <Users2 size={16} />
                                    </div>
                                    <h4 className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Create Team</h4>
                                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Guided Walkthrough</p>
                                </button>

                                <button
                                    onClick={() => {
                                        setSelectedTour('create-task')
                                        setShowPrompt(false)
                                    }}
                                    className={`p-4 rounded-[24px] border transition-all group text-left ${selectedTour === 'create-task' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 ring-2 ring-emerald-500/20' : 'border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 hover:border-emerald-500'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform ${selectedTour === 'create-task' ? 'bg-emerald-500 text-white scale-110' : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 group-hover:scale-110'}`}>
                                        <Briefcase size={16} />
                                    </div>
                                    <h4 className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Create Task</h4>
                                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Guided Walkthrough</p>
                                </button>
                            </div>

                            {showPrompt && (
                                <div className="mt-4 px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl animate-in slide-in-from-bottom-2 fade-in duration-300">
                                    <p className="text-[10px] font-black tracking-widest uppercase text-red-500 flex items-center gap-2">
                                        <LayoutDashboard size={14} />
                                        Please select a walkthrough to begin!
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={prevSlide}
                            disabled={currentSlide === 0}
                            className={`flex items-center gap-2 px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${currentSlide === 0
                                ? 'opacity-0 pointer-events-none'
                                : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>

                        <div className="flex gap-2">
                            {slides.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide
                                        ? 'w-6 bg-indigo-600 dark:bg-indigo-500'
                                        : 'w-1.5 bg-gray-200 dark:bg-slate-700'
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={nextSlide}
                            className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 dark:bg-white text-white dark:text-indigo-950 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 dark:hover:bg-gray-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                        >
                            {currentSlide === slides.length - 1
                                ? (selectedTour ? 'Learn Walkthrough' : 'Get Started')
                                : 'Next'}
                            {currentSlide < slides.length - 1 && <ChevronRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
