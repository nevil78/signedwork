import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, ArrowRight, Play, SkipForward } from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  content?: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'none';
  optional?: boolean;
}

export interface TourConfig {
  id: string;
  title: string;
  description: string;
  category: 'employee' | 'company' | 'manager';
  steps: TourStep[];
  estimatedDuration: string;
}

interface GuidedTourProps {
  tour: TourConfig;
  isActive: boolean;
  onComplete: () => void;
  onClose: () => void;
  onSkip: () => void;
}

export default function GuidedTour({ 
  tour, 
  isActive, 
  onComplete, 
  onClose, 
  onSkip 
}: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setCurrentStep(0);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  const currentTourStep = tour.steps[currentStep];
  const isLastStep = currentStep === tour.steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  // Highlight target element
  useEffect(() => {
    if (isVisible && currentTourStep?.target) {
      const targetElement = document.querySelector(currentTourStep.target);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.classList.add('tour-highlight');
        
        // Remove highlight when moving to next step
        return () => {
          targetElement.classList.remove('tour-highlight');
        };
      }
    }
  }, [currentStep, isVisible, currentTourStep?.target]);

  if (!isVisible || !currentTourStep) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={handleClose} />
      
      {/* Tour Card */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md mx-4">
        <Card className="shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {tour.category.charAt(0).toUpperCase() + tour.category.slice(1)}
                </Badge>
                <span className="text-sm text-gray-500">
                  {currentStep + 1} of {tour.steps.length}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="text-lg">{currentTourStep.title}</CardTitle>
            <CardDescription>{currentTourStep.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {currentTourStep.content && (
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {currentTourStep.content}
              </div>
            )}
            
            {currentTourStep.action && currentTourStep.action !== 'none' && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                💡 Try to {currentTourStep.action} the highlighted element
              </div>
            )}

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tour.steps.length) * 100}%` }}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handlePrevious}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSkip}
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Skip Tour
                </Button>
                
                <Button 
                  onClick={handleNext}
                  size="sm"
                >
                  {isLastStep ? (
                    <>
                      Complete
                      <Play className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom CSS for highlighting */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 99;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 2px white;
          border-radius: 8px;
          background-color: rgba(59, 130, 246, 0.1) !important;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 2px white; }
          50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 0 0 2px white; }
        }
      `}</style>
    </>
  );
}