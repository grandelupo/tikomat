import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { router } from '@inertiajs/react';

interface TutorialStep {
    target: string;
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialProps {
    steps: TutorialStep[];
    tutorialName: string;
    showTutorial: boolean;
    onComplete?: () => void;
    onSkip?: () => void;
}

export default function Tutorial({ 
    steps, 
    tutorialName, 
    showTutorial, 
    onComplete, 
    onSkip 
}: TutorialProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(showTutorial);
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
    const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

    useEffect(() => {
        setIsVisible(showTutorial);
        if (showTutorial) {
            setCurrentStep(0);
        }
    }, [showTutorial]);

    useEffect(() => {
        if (isVisible && steps[currentStep]) {
            const target = document.querySelector(steps[currentStep].target) as HTMLElement;
            if (target) {
                setTargetElement(target);
                const rect = target.getBoundingClientRect();
                setOverlayPosition({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height
                });
                
                // Scroll target into view
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentStep, isVisible, steps]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        try {
            await router.post('/tutorials/complete', {
                tutorial_name: tutorialName
            });
            setIsVisible(false);
            onComplete?.();
        } catch (error) {
            console.error('Failed to mark tutorial as completed:', error);
        }
    };

    const handleSkip = async () => {
        try {
            await router.post('/tutorials/complete', {
                tutorial_name: tutorialName
            });
            setIsVisible(false);
            onSkip?.();
        } catch (error) {
            console.error('Failed to skip tutorial:', error);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        onSkip?.();
    };

    const getTooltipPosition = () => {
        if (!targetElement) return {};

        const step = steps[currentStep];
        const rect = targetElement.getBoundingClientRect();
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        const offset = 20;

        switch (step.position) {
            case 'top':
                return {
                    top: overlayPosition.top - tooltipHeight - offset,
                    left: overlayPosition.left + (overlayPosition.width / 2) - (tooltipWidth / 2),
                };
            case 'bottom':
                return {
                    top: overlayPosition.top + overlayPosition.height + offset,
                    left: overlayPosition.left + (overlayPosition.width / 2) - (tooltipWidth / 2),
                };
            case 'left':
                return {
                    top: overlayPosition.top + (overlayPosition.height / 2) - (tooltipHeight / 2),
                    left: overlayPosition.left - tooltipWidth - offset,
                };
            case 'right':
                return {
                    top: overlayPosition.top + (overlayPosition.height / 2) - (tooltipHeight / 2),
                    left: overlayPosition.left + overlayPosition.width + offset,
                };
            default:
                return {
                    top: overlayPosition.top + overlayPosition.height + offset,
                    left: overlayPosition.left + (overlayPosition.width / 2) - (tooltipWidth / 2),
                };
        }
    };

    if (!isVisible || steps.length === 0) {
        return null;
    }

    const currentStepData = steps[currentStep];

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
            
            {/* Highlight */}
            {targetElement && (
                <div
                    className="fixed z-50 border-4 border-blue-500 rounded-lg pointer-events-none"
                    style={{
                        top: overlayPosition.top - 4,
                        left: overlayPosition.left - 4,
                        width: overlayPosition.width + 8,
                        height: overlayPosition.height + 8,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    }}
                />
            )}

            {/* Tooltip */}
            <Card 
                className="fixed z-50 w-80 shadow-xl"
                style={getTooltipPosition()}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                            <CardDescription className="text-sm">
                                Step {currentStep + 1} of {steps.length}
                            </CardDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-4">
                        {currentStepData.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevious}
                                disabled={currentStep === 0}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleNext}
                            >
                                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                                {currentStep < steps.length - 1 && (
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                )}
                            </Button>
                        </div>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSkip}
                            className="text-gray-500"
                        >
                            <SkipForward className="h-4 w-4 mr-1" />
                            Skip Tour
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
} 