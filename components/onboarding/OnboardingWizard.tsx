"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Rocket, Container, Globe, CheckCircle, ChevronRight, X } from "lucide-react"

interface OnboardingWizardProps {
    onComplete: () => void
    isNewUser?: boolean
}

const steps = [
    {
        id: 1,
        title: "Welcome to Expanse",
        description: "Your visual Docker Compose deployment platform",
        icon: Rocket,
        content: (
            <div className="space-y-4 py-4">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Rocket className="w-10 h-10 text-emerald-500" />
                    </div>
                </div>
                <p className="text-center text-slate-400">
                    We're glad you're here. Expanse lets you deploy and manage Docker containers
                    visually, without needing to remember complex commands.
                </p>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                    <h4 className="text-sm font-semibold text-white mb-2">As the first user, you have admin privileges</h4>
                    <p className="text-xs text-slate-400">
                        You can manage all aspects of this Expanse instance, including adding remote nodes,
                        managing deployments, and configuring system settings.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 2,
        title: "What can you do?",
        description: "Core features at a glance",
        icon: Container,
        content: (
            <div className="space-y-4 py-4">
                <div className="grid gap-3">
                    <div className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                            <Container className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-white">Visual Composer</h4>
                            <p className="text-xs text-slate-400">Drag and drop services to build your stack visually</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-white">One-Click Deploy</h4>
                            <p className="text-xs text-slate-400">Deploy your stack to local or remote nodes with one click</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                        <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-white">Service Library</h4>
                            <p className="text-xs text-slate-400">Choose from 100+ pre-configured services and stacks</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 3,
        title: "Quick Start",
        description: "Get your first deployment running",
        icon: CheckCircle,
        content: (
            <div className="space-y-4 py-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold text-white">1</div>
                        <p className="text-sm text-slate-300">Click the <span className="text-emerald-400 font-semibold">+</span> button to open the Service Library</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold text-white">2</div>
                        <p className="text-sm text-slate-300">Browse or search for a service you need</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold text-white">3</div>
                        <p className="text-sm text-slate-300">Click "Add to Deployment" to add it to your canvas</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold text-white">4</div>
                        <p className="text-sm text-slate-300">Configure ports and resources, then hit <span className="text-emerald-400 font-semibold">Execute</span></p>
                    </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-xs text-amber-300">
                        <span className="font-semibold">Pro tip:</span> You can connect remote nodes in Settings to deploy on other servers
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 4,
        title: "You're all set!",
        description: "Ready to start deploying",
        icon: CheckCircle,
        content: (
            <div className="space-y-4 py-4">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                </div>
                <p className="text-center text-slate-400">
                    You're ready to start using Expanse. Explore the playground,
                    add services, and deploy your first container.
                </p>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 text-center">
                    <p className="text-xs text-slate-500">
                        Need help? Check the settings menu or contact support anytime.
                    </p>
                </div>
            </div>
        )
    }
]

export default function OnboardingWizard({ onComplete, isNewUser }: OnboardingWizardProps) {
    const [open, setOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem("expanse_onboarding_completed")
        const urlParams = new URLSearchParams(window.location.search)
        const forceShow = urlParams.get('wizard') === '1'
        console.log('[Onboarding] hasSeen:', hasSeenOnboarding, 'isNewUser:', isNewUser, 'forceShow:', forceShow)
        if (!hasSeenOnboarding || isNewUser || forceShow) {
            setOpen(true)
        }
    }, [isNewUser])

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            handleComplete()
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleComplete = () => {
        localStorage.setItem("expanse_onboarding_completed", "true")
        setOpen(false)
        onComplete()
    }

    const handleSkip = () => {
        handleComplete()
    }

    const step = steps[currentStep]
    const Icon = step.icon

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) handleSkip()
        }}>
            <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md">
                <DialogHeader className="text-center items-center">
                    <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-2">
                        <Icon className="w-6 h-6 text-emerald-500" />
                    </div>
                    <DialogTitle className="text-xl">{step.title}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {step.description}
                    </DialogDescription>
                </DialogHeader>

                {step.content}

                <div className="flex justify-center gap-2 mt-4">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentStep ? "bg-emerald-500" : "bg-slate-700"
                            }`}
                        />
                    ))}
                </div>

                <DialogFooter className="flex-row justify-between mt-4">
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                        className="text-slate-400 hover:text-white"
                    >
                        Skip
                    </Button>
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                                Back
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white"
                        >
                            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}