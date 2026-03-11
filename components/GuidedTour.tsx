'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronRight, Play } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Portal from '@/components/ui/Portal'

interface TourStep {
    id: string
    targetId: string
    fallbackTargetId?: string
    title: string
    fallbackTitle?: string
    content: string
    fallbackContent?: string
    placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
    path?: string
    action?: 'click' | 'input' | 'custom'
    delay?: number
    fallbackHideControls?: boolean
    showNext?: boolean
    nextLabel?: string
    fallbackTourId?: string
}

interface GuidedTourContextType {
    startTour: (tourId: string) => void
    endTour: () => void
    nextStep: () => void
    currentStep: number
    isActive: boolean
}

const GuidedTourContext = createContext<GuidedTourContextType | undefined>(undefined)

const tours: Record<string, TourStep[]> = {
    'create-project': [
        {
            id: 'sidebar-projects',
            targetId: 'sidebar-projects',
            title: 'Step 1: Go to Projects',
            content: 'First, let\'s head over to the Projects section where you can manage your work.',
            placement: 'right',
            path: '/projects',
            action: 'click'
        },
        {
            id: 'tour-create-project-btn',
            targetId: 'tour-create-project-btn',
            title: 'Step 2: Create Project',
            content: 'Click here to start defining your new project.',
            placement: 'bottom',
            action: 'click'
        },
        {
            id: 'tour-project-name-input',
            targetId: 'tour-project-name-input',
            title: 'Step 3: Project name',
            content: 'Start by giving your project a clear, professional name.',
            placement: 'bottom',
            action: 'input'
        },
        {
            id: 'tour-project-description-input',
            targetId: 'tour-project-description-input',
            title: 'Step 4: Objective & Scope',
            content: 'Add a brief description of the mission objectives and team focus.',
            placement: 'bottom',
            action: 'input'
        },
        {
            id: 'tour-project-start-date',
            targetId: 'tour-project-start-date',
            title: 'Step 5: Deployment Date',
            content: 'Set a start date for the operation to begin.',
            placement: 'bottom',
            action: 'input'
        },
        {
            id: 'tour-project-end-date',
            targetId: 'tour-project-end-date',
            title: 'Step 6: Mission Deadline',
            content: 'Add a projected completion date to keep the team on schedule.',
            placement: 'bottom',
            action: 'input'
        },
        {
            id: 'tour-project-status-planning',
            targetId: 'tour-project-status-planning',
            title: 'Step 7: Status - Planning',
            content: 'If the project is still in the preparation phase, keep it in "Planning".',
            placement: 'top',
            action: 'click'
        },
        {
            id: 'tour-project-status-active',
            targetId: 'tour-project-status-active',
            title: 'Step 8: Status - Active',
            content: 'Switch to "Active" once deployment has officially commenced.',
            placement: 'top',
            action: 'click'
        },
        {
            id: 'tour-create-project-submit',
            targetId: 'tour-create-project-submit',
            title: 'Step 9: Finalize',
            content: 'Once you\'re ready, click Create Project to begin!',
            placement: 'top',
            action: 'custom'
        },
        {
            id: 'tour-project-card',
            targetId: 'tour-project-card',
            title: 'Step 10: View Project',
            content: 'Your project is ready! Click on the project card to view its detailed metrics and manage tasks.',
            placement: 'bottom',
            action: 'click'
        },
        {
            id: 'tour-project-integrity',
            targetId: 'tour-project-integrity',
            title: 'Step 11: Integrity Check',
            content: 'This bar tracks your overall mission success. As tasks are completed, your Integrity score will rise.',
            placement: 'bottom'
        },
        {
            id: 'tour-project-kpis',
            targetId: 'tour-project-kpis',
            title: 'Step 12: Mission KPIs',
            content: 'Keep an eye on these vital signs to monitor task distribution and priority shifts.',
            placement: 'top'
        },
        {
            id: 'tour-project-complete',
            targetId: 'step-complete-no-highlight-marker', // Unique marker to definitively prevent stale highlights
            title: 'Congratulations!',
            content: 'Excellent work! You\'ve successfully mastered the art of creating and monitoring a project. You\'re now ready to create a project for your team.',
            placement: 'center'
        }
    ],
    'create-team': [
        {
            id: 'tour-create-dropdown',
            targetId: 'tour-create-dropdown',
            title: 'Step 1: Create Menu',
            content: 'Click here to open the global creation menu.',
            placement: 'bottom',
            action: 'click'
        },
        {
            id: 'tour-new-team-option',
            targetId: 'tour-new-team-option',
            title: 'Step 2: New Team',
            content: 'Select "New Team" to begin building your crew.',
            placement: 'bottom',
            action: 'click'
        },
        {
            id: 'tour-team-name-input',
            targetId: 'tour-team-name-input',
            fallbackTargetId: 'tour-team-no-projects-link',
            title: 'Step 3: Team Name',
            fallbackTitle: 'You have no project yet',
            content: 'Enter a name for your team (e.g. Design Team, Frontend Devs).',
            fallbackContent: 'Oops! You need a project first. Click here to create your first project so you can house your team.',
            placement: 'bottom',
            action: 'input',
            fallbackHideControls: true
        },
        {
            id: 'tour-team-parent-project',
            targetId: 'tour-team-parent-project',
            title: 'Step 4: Project Context',
            content: 'Select which project this team belongs to. This ensures their work is tracked appropriately.',
            placement: 'bottom',
            action: 'input'
        },
        {
            id: 'tour-team-lead',
            targetId: 'tour-team-lead',
            title: 'Step 5: Leadership',
            content: 'Assign a Team Lead. They will be responsible for managing task delegation and team integrity.',
            placement: 'right',
            action: 'input'
        },
        {
            id: 'tour-team-description-input',
            targetId: 'tour-team-description-input',
            title: 'Step 6: Team Details',
            content: 'Provide a brief description of the core team and responsibilities for this team.',
            placement: 'top',
            action: 'input'
        },
        {
            id: 'tour-create-team-submit',
            targetId: 'tour-create-team-submit',
            title: 'Step 7: Finalize',
            content: 'Click Create to finalize your team formation and onboard your members.',
            placement: 'top',
            action: 'custom'
        },
        {
            id: 'tour-team-complete',
            targetId: 'step-complete-no-highlight-marker',
            title: 'Congratulations!',
            content: 'Outstanding! You\'ve successfully built your first team. You\'re now ready to start assigning tasks to your members and executing the mission.',
            placement: 'center'
        }
    ],
    'create-task': [
        {
            id: 'tour-create-dropdown',
            targetId: 'tour-create-dropdown',
            title: 'Step 1: Create Menu',
            content: 'Click here to open the global creation menu.',
            placement: 'bottom',
            action: 'click'
        },
        {
            id: 'tour-new-task-option',
            targetId: 'tour-new-task-option',
            title: 'Step 2: New Task',
            content: 'Select "New Task" to begin delegating an objective.',
            placement: 'bottom',
            action: 'click'
        },
        {
            id: 'tour-task-title-input',
            targetId: 'tour-task-title-input',
            fallbackTargetId: 'tour-task-no-projects-link',
            title: 'Step 3: Task Title',
            fallbackTitle: 'You have no project yet',
            content: 'What needs to be done? Enter the task title here.',
            fallbackContent: 'Oops! You need a project first. Click here to create your first project so you can house your team.',
            placement: 'bottom',
            action: 'input',
            fallbackHideControls: true
        },
        {
            id: 'tour-task-team-select',
            targetId: 'tour-task-team-select',
            title: 'Step 4: Choose a team',
            content: 'Which team will handle this? Select the appropriate team.',
            placement: 'bottom',
            action: 'input'
        },
        {
            id: 'tour-task-assignee-select',
            targetId: 'tour-task-assignee-select',
            title: 'Step 5: Assign to who?',
            content: 'Who is taking point on this? Assign a team member to the task.',
            placement: 'bottom',
            action: 'input'
        },
        {
            id: 'tour-task-status-select',
            targetId: 'tour-task-status-select',
            title: 'Step 6: Current Status',
            content: 'Set the initial status. Usually, new tasks start out as "To Do" or "Pending".',
            placement: 'bottom',
            action: 'input'
        },
        {
            id: 'tour-task-priority-select',
            targetId: 'tour-task-priority-select',
            title: 'Step 7: Priority Level',
            content: 'How urgent is this task? Set the priority accordingly.',
            placement: 'bottom',
            action: 'input'
        },
        {
            id: 'tour-task-due-date',
            targetId: 'tour-task-due-date',
            title: 'Step 8: Deadline',
            content: 'When does this need to be completed? Set a due date.',
            placement: 'top',
            action: 'input'
        },
        {
            id: 'tour-task-due-time',
            targetId: 'tour-task-due-time',
            title: 'Step 9: Time Objective',
            content: 'Specify an exact time for the deadline.',
            placement: 'top',
            action: 'input'
        },
        {
            id: 'tour-task-project-select',
            targetId: 'tour-task-project-select',
            title: 'Step 10: Select Project',
            content: 'Link this task to its overarching project context.',
            placement: 'top',
            action: 'input'
        },
        {
            id: 'tour-task-description-input',
            targetId: 'tour-task-description-input',
            title: 'Step 11: Task Details',
            content: 'Provide specific operational details regarding the objective.',
            placement: 'top',
            action: 'input'
        },
        {
            id: 'tour-create-task-submit',
            targetId: 'tour-create-task-submit',
            title: 'Step 12: Execute',
            content: 'Perfect! Now click Create Task to lock it in and officially start the mission.',
            placement: 'top',
            action: 'custom'
        },
        {
            id: 'tour-task-complete',
            targetId: 'step-complete-no-highlight-marker',
            title: 'Congratulations!',
            content: 'Mission logged. You are now fully equipped to issue directives and manage your team operations via tasks.',
            placement: 'center'
        }
    ],
    'add-team-members': [
        {
            id: 'tour-create-dropdown',
            targetId: 'tour-create-dropdown',
            title: 'Step 1: Invite Personnel',
            content: 'Click the Create button to open the global operations menu.',
            placement: 'bottom',
            action: 'click'
        },
        {
            id: 'tour-new-member-option',
            targetId: 'tour-new-member-option',
            title: 'Step 2: New Member',
            content: 'Select "New Member" to begin onboarding a new collaborator to your project.',
            placement: 'bottom',
            action: 'click'
        },
        {
            id: 'tour-invite-project-select',
            targetId: 'tour-invite-project-select',
            fallbackTargetId: 'tour-invite-no-projects-link',
            title: 'Step 3: Target Project',
            fallbackTitle: 'No Projects Found',
            content: 'Select the project where this new member will be deployed.',
            fallbackContent: 'You need a project before you can invite members. Click here to start the Project Creation walkthrough!',
            placement: 'bottom',
            action: 'input',
            fallbackHideControls: true,
            fallbackTourId: 'create-project'
        },
        {
            id: 'tour-invite-email-input',
            targetId: 'tour-invite-email-input',
            title: 'Step 4: Member Email',
            content: 'Enter the email address of the personnel you wish to invite.',
            placement: 'bottom',
            action: 'input'
        },
        {
            id: 'tour-invite-role-select',
            targetId: 'tour-invite-role-select',
            title: 'Step 5: Operational Role',
            content: 'Define their access level—Admin, Member, or Viewer.',
            placement: 'bottom',
            action: 'input'
        },
        {
            id: 'tour-invite-team-select',
            targetId: 'tour-invite-team-select',
            title: 'Step 6: Team Assignment',
            content: 'Optional: Select one or more teams to immediately assign this member to.',
            placement: 'left',
            action: 'custom',
            showNext: true,
            nextLabel: 'Ok'
        },
        {
            id: 'tour-invite-submit-btn',
            targetId: 'tour-invite-submit-btn',
            title: 'Step 7: Finalize Invitation',
            content: 'Click Send Invite to officially authorize their access.',
            placement: 'top',
            action: 'click',
            delay: 3000
        },
        {
            id: 'tour-add-members-complete',
            targetId: 'step-complete-no-highlight-marker',
            title: 'Congratulations!',
            content: 'Outstanding work! You\'ve successfully expanded your operational capability by onboarding new personnel. You\'re now ready to lead your team to victory!',
            placement: 'center'
        }
    ]
}

export function GuidedTourProvider({ children }: { children: React.ReactNode }) {
    const [activeTourId, setActiveTourId] = useState<string | null>(null)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
    const [isFading, setIsFading] = useState(false)
    const [isTargetFilled, setIsTargetFilled] = useState(false)
    const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const pathname = usePathname()

    const tourSteps = activeTourId ? tours[activeTourId] : []
    const currentStep = tourSteps[currentStepIndex]

    // Check if target input is filled
    useEffect(() => {
        if (!currentStep) {
            setIsTargetFilled(false)
            return
        }

        const checkValue = () => {
            const element = document.getElementById(currentStep.targetId) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            const isInput = currentStep.action === 'input'

            if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT')) {
                setIsTargetFilled(element.value.trim().length > 0)
            } else {
                // If it's an input step but element not found, it's NOT filled
                // If it's NOT an input step, it's considered "ready" to progress
                setIsTargetFilled(!isInput)
            }
        }

        // Initial check
        checkValue()

        // Also check periodically since elements might take a moment to mount
        const interval = setInterval(checkValue, 500)
        
        window.addEventListener('input', checkValue)
        window.addEventListener('change', checkValue)
        return () => {
            clearInterval(interval)
            window.removeEventListener('input', checkValue)
            window.removeEventListener('change', checkValue)
        }
    }, [currentStep])

    const updateTargetRect = useCallback(() => {
        if (!currentStep) return
        let element = document.getElementById(currentStep.targetId)
        if (!element && currentStep.fallbackTargetId) {
            element = document.getElementById(currentStep.fallbackTargetId)
        }

        if (element) {
            const rect = element.getBoundingClientRect()
            setTargetRect(prev => {
                if (!prev) return rect
                // Prevent infinite re-renders by only updating if coordinates moved
                if (Math.abs(prev.top - rect.top) < 1 &&
                    Math.abs(prev.left - rect.left) < 1 &&
                    Math.abs(prev.width - rect.width) < 1 &&
                    Math.abs(prev.height - rect.height) < 1) {
                    return prev
                }
                return rect
            })
        } else {
            setTargetRect(prev => prev === null ? null : null)
        }
    }, [currentStep])

    const endTour = useCallback(() => {
        setIsFading(true)
        fadeTimeoutRef.current = setTimeout(() => {
            setActiveTourId(null)
            setCurrentStepIndex(0)
            setIsFading(false)
            fadeTimeoutRef.current = null
            localStorage.removeItem('activeTour')
            localStorage.removeItem('activeTourStep')
        }, 500)
    }, [])

    const startTour = useCallback((tourId: string, skipNavigation: boolean = true) => {
        // Clear any pending fade out to prevent the new tour from closing immediately
        if (fadeTimeoutRef.current) {
            clearTimeout(fadeTimeoutRef.current)
            fadeTimeoutRef.current = null
        }
        setIsFading(false)

        const steps = tours[tourId]
        let startIndex = 0

        // If the first step is just a navigation step and we're already there, skip it (unless forced)
        if (skipNavigation && steps && steps.length > 0 && steps[0].path === pathname) {
            startIndex = 1
        }

        setActiveTourId(tourId)
        setCurrentStepIndex(startIndex)
        localStorage.setItem('activeTour', tourId)
        localStorage.setItem('activeTourStep', startIndex.toString())
    }, [pathname])

    const nextStep = useCallback(() => {
        if (currentStepIndex < tourSteps.length - 1) {
            const nextIndex = currentStepIndex + 1
            setCurrentStepIndex(nextIndex)
            localStorage.setItem('activeTourStep', nextIndex.toString())
        } else {
            endTour()
        }
    }, [currentStepIndex, tourSteps.length, endTour])

    // Silky Smooth 60FPS Tracking Loop
    useEffect(() => {
        let animationFrameId: number;
        const loop = () => {
            updateTargetRect();
            animationFrameId = requestAnimationFrame(loop);
        };
        loop();

        window.addEventListener('resize', updateTargetRect)
        window.addEventListener('scroll', updateTargetRect, true)
        return () => {
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener('resize', updateTargetRect)
            window.removeEventListener('scroll', updateTargetRect, true)
        }
    }, [updateTargetRect])

    // Auto-advance if on the correct path
    useEffect(() => {
        if (!currentStep || !currentStep.path) return
        if (pathname === currentStep.path && currentStepIndex === 0) {
            setCurrentStepIndex(1)
            localStorage.setItem('activeTourStep', '1')
        }
    }, [pathname, currentStep, currentStepIndex])

    useEffect(() => {
        if (!currentStep) return

        const handleInteraction = (e: MouseEvent) => {
            let element = document.getElementById(currentStep.targetId)
            let isFallback = false
            if (!element && currentStep.fallbackTargetId) {
                element = document.getElementById(currentStep.fallbackTargetId)
                isFallback = true
            }

            if (element && (element.contains(e.target as Node) || e.target === element)) {
                // If we clicked a fallback link
                if (isFallback) {
                    if (currentStep.fallbackTourId) {
                        // Small delay to allow InviteMemberModal to close and navigation to settle
                        setTimeout(() => {
                            if (currentStep.fallbackTourId) {
                                startTour(currentStep.fallbackTourId, false) // Don't skip navigation step on redirect
                            }
                        }, 300)
                    } else {
                        endTour()
                    }
                    return
                }

                // Normal action handling (only for 'click')
                if (currentStep.action === 'click') {
                    if (currentStepIndex < tourSteps.length - 1) {
                        const nextIndex = currentStepIndex + 1
                        if (currentStep.delay) {
                            setTimeout(() => {
                                setCurrentStepIndex(nextIndex)
                                localStorage.setItem('activeTourStep', nextIndex.toString())
                            }, currentStep.delay)
                        } else {
                            setCurrentStepIndex(nextIndex)
                            localStorage.setItem('activeTourStep', nextIndex.toString())
                        }
                    } else {
                        endTour()
                    }
                }
            }
        }

        document.addEventListener('mousedown', handleInteraction)
        return () => document.removeEventListener('mousedown', handleInteraction)
    }, [currentStep, currentStepIndex, tourSteps.length, startTour, endTour])


    // Keyboard interaction: press 'Enter' to advance on 'input' steps
    useEffect(() => {
        if (!currentStep || currentStep.action !== 'input') return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && isTargetFilled) {
                nextStep()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentStep, nextStep])

    // Auto-focus next target when step changes
    useEffect(() => {
        if (!currentStep || !activeTourId) return

        const focusTarget = () => {
            const element = document.getElementById(currentStep.targetId) ||
                (currentStep.fallbackTargetId ? document.getElementById(currentStep.fallbackTargetId) : null)

            if (element && document.activeElement !== element) {
                if (element instanceof HTMLInputElement ||
                    element instanceof HTMLTextAreaElement ||
                    element instanceof HTMLButtonElement ||
                    element instanceof HTMLSelectElement) {
                    element.focus()
                    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                        element.select()
                    }
                }
            }
        }

        // Small delay to allow for page transitions or modal animations
        const timer = setTimeout(focusTarget, 150)
        return () => clearTimeout(timer)
    }, [currentStepIndex, activeTourId, currentStep])


    // Auto-fade timer for 'center' placement
    useEffect(() => {
        if (currentStep?.placement === 'center' && activeTourId) {
            const timer = setTimeout(() => {
                endTour()
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [currentStepIndex, activeTourId])

    useEffect(() => {
        const savedTour = localStorage.getItem('activeTour')
        const savedStep = localStorage.getItem('activeTourStep')
        if (savedTour && tours[savedTour]) {
            setActiveTourId(savedTour)
            if (savedStep) {
                setCurrentStepIndex(parseInt(savedStep, 10))
            }
        }
    }, [])

    const getTooltipStyle = () => {
        if (!targetRect || !currentStep) return {}

        let top = targetRect.top
        let left = targetRect.left + (targetRect.width / 2) - 160

        if (currentStep.placement === 'bottom') {
            top = targetRect.bottom + 20
        } else if (currentStep.placement === 'top') {
            top = targetRect.top - 220 // Increased buffer
        } else if (currentStep.placement === 'right') {
            top = targetRect.top
            left = targetRect.right + 20
        } else if (currentStep.placement === 'left') {
            top = targetRect.top
            left = targetRect.left - 300
        }

        // Keep within viewport
        const padding = 10
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Use a dynamic width for clamping (mobile-sheet style)
        const elementWidth = viewportWidth < 640 ? viewportWidth - (padding * 2) : 320

        if (left < padding) left = padding
        if (left + elementWidth > viewportWidth - padding) left = viewportWidth - elementWidth - padding
        if (top < padding) top = padding
        if (top + 200 > viewportHeight - padding) top = viewportHeight - 200 - padding

        return { top, left }
    }

    const contextValue = React.useMemo(() => ({
        startTour,
        endTour,
        nextStep,
        currentStep: currentStepIndex,
        isActive: !!activeTourId
    }), [startTour, endTour, nextStep, currentStepIndex, activeTourId])

    return (
        <GuidedTourContext.Provider value={contextValue}>
            {children}
            {activeTourId && tourSteps[currentStepIndex] && (() => {
                const step = tourSteps[currentStepIndex];
                return (
                    <Portal>
                        <div key={activeTourId} className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                            {/* THE BACKDROP */}
                            <div className={`absolute inset-0 transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${step.placement === 'center'
                                ? 'bg-slate-950/80 dark:bg-slate-950/90 pointer-events-auto'
                                : 'bg-transparent'
                                }`} />

                            {/* MODE 1: Standard Element Highlight (Only if NOT 'center') */}
                            {step.placement !== 'center' && targetRect && step.targetId && (
                                <div
                                    className="absolute border-[3px] border-indigo-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                                    style={{
                                        top: targetRect.top - 4,
                                        left: targetRect.left - 4,
                                        width: targetRect.width + 8,
                                        height: targetRect.height + 8
                                    }}
                                />
                            )}

                            {/* OVERLAY CONTAINER: Handles centering for celebration modal and alignment for tooltips */}
                            <div className={`absolute inset-0 flex p-4 ${step.placement === 'center' ? 'items-center justify-center' : 'items-start justify-start'}`}>
                                {/* Tooltip Content */}
                                {(step.placement === 'center' || targetRect) && (
                                    <div
                                        className={`pointer-events-auto bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-indigo-100 dark:border-indigo-500/20 transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isFading ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'} ${step.placement === 'center'
                                            ? 'w-full max-w-[90vw] sm:max-w-[480px] p-6 sm:p-8 text-center z-[10001]'
                                            : 'absolute w-[calc(100vw-20px)] sm:w-[320px]'
                                            }`}
                                        style={step.placement === 'center' ? {} : getTooltipStyle()}
                                    >
                                        {step.placement === 'center' && (
                                            <div className="flex flex-col items-center mb-6">
                                                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-[32px] flex items-center justify-center text-indigo-500 mb-6 animate-bounce">
                                                    <Play size={40} fill="currentColor" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tightest leading-none">
                                                        {currentStepIndex === tourSteps.length - 1 ? (
                                                            `${activeTourId === 'create-project' ? 'Create Project' :
                                                                activeTourId === 'create-task' ? 'Create Task' :
                                                                    activeTourId === 'create-team' ? 'Create Team' : 'Mission'} Tutorial Completed`
                                                        ) : (
                                                            step.title
                                                        )}
                                                    </h4>
                                                </div>
                                            </div>
                                        )}
                                        {/* Close Button - Now absolutely positioned in the corner */}
                                        <button onClick={endTour} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full z-10">
                                            <X size={step.placement === 'center' ? 24 : 16} />
                                        </button>

                                        {(() => {
                                            const isFallback = !document.getElementById(step.targetId) && !!step.fallbackTargetId;
                                            const showControls = !(isFallback && step.fallbackHideControls);
                                            const displayTitle = (isFallback && step.fallbackTitle) ? step.fallbackTitle : step.title;
                                            const displayContent = (isFallback && step.fallbackContent) ? step.fallbackContent : step.content;

                                            return (
                                                <div className={!showControls ? 'text-center' : ''}>
                                                    <div className={`flex items-center justify-between mb-4 ${!showControls ? 'justify-center' : ''}`}>
                                                        <h4 className={`font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest ${step.placement === 'center' ? 'hidden' : 'text-sm'}`}>
                                                            {displayTitle}
                                                        </h4>
                                                    </div>
                                                    <p className={`font-bold text-gray-700 dark:text-slate-200 leading-relaxed ${!showControls ? 'mb-0' : 'mb-6 sm:mb-8'} ${step.placement === 'center' ? 'text-base sm:text-lg' : 'text-[11px] sm:text-xs'}`}>
                                                        {displayContent}
                                                    </p>
                                                    {showControls && (
                                                        <div className="flex items-center justify-between mt-6 sm:mt-8">
                                                            <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                                                                {step.placement === 'center' ? 'Experience points gained' : `Step ${currentStepIndex + 1} of ${tourSteps.length}`}
                                                            </span>
                                                            <div className="flex items-center gap-3 sm:gap-4">
                                                                <div className="flex gap-1 hidden xs:flex">
                                                                    {tourSteps.map((_, i) => (
                                                                        <div key={i} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${i === currentStepIndex ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-slate-800'}`} />
                                                                    ))}
                                                                </div>
                                                                {(step.showNext || (step.action !== 'click' && step.action !== 'custom' && step.placement !== 'center')) && (
                                                                    <button
                                                                        onClick={nextStep}
                                                                        disabled={step.action === 'input' && !isTargetFilled}
                                                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-indigo-500/20 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                    >
                                                                        {step.nextLabel || (step.showNext ? 'Ok' : 'Next Step')}
                                                                        <ChevronRight size={10} className="sm:w-3 sm:h-3 group-hover:translate-x-0.5 transition-transform" />
                                                                    </button>
                                                                )}
                                                                {step.placement === 'center' && currentStepIndex === tourSteps.length - 1 && (
                                                                    <button
                                                                        onClick={endTour}
                                                                        className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                                                                    >
                                                                        Dismiss
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Portal>
                );
            })()}
        </GuidedTourContext.Provider>
    )
}

export const useGuidedTour = () => {
    const context = useContext(GuidedTourContext)
    if (!context) {
        return {
            startTour: () => { },
            endTour: () => { },
            nextStep: () => { },
            currentStep: 0,
            isActive: false
        }
    }
    return context
}
