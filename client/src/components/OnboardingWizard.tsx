import { useState, useEffect, useCallback, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Check, SkipForward, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Wizard context passed to step render function
interface WizardStepContext {
  stepId: string;
  currentData: any;
  allData: Record<string, any>;
  isValid: boolean;
  errors: string[];
  setData: (data: any) => void;
  setValid: (valid: boolean, errors?: string[]) => void;
  onComplete: () => void;
  onSkip: () => void;
  saveDraft: (data?: any) => void;
}

// Step definition with render-prop pattern
interface WizardStep {
  id: string;
  title: string;
  description: string;
  isOptional?: boolean;
  canSkip?: boolean;
  render: (context: WizardStepContext) => React.ReactNode;
  validate?: (data: any) => { isValid: boolean; errors: string[] };
}

interface OnboardingWizardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  steps: WizardStep[];
  currentStepId: string;
  completedSteps: Set<string>;
  wizardData: Record<string, any>;
  title?: string;
  onStepChange: (stepId: string) => void;
  onStepComplete: (stepId: string, data: any) => void;
  onStepSkip?: (stepId: string) => void;
  onWizardComplete: (allData: Record<string, any>) => void;
  onSaveProgress?: (data: { currentStepId: string; completedSteps: string[]; wizardData: Record<string, any> }) => void;
  allowSkipping?: boolean;
  showStepNavigation?: boolean;
}

export default function OnboardingWizard({
  steps,
  currentStepId,
  completedSteps,
  wizardData,
  title = "Setup Wizard",
  onStepChange,
  onStepComplete,
  onStepSkip,
  onWizardComplete,
  onSaveProgress,
  className = "",
  allowSkipping = true,
  showStepNavigation = true,
  ...divProps
}: OnboardingWizardProps) {
  // Internal state for current step validation
  const [stepValidation, setStepValidation] = useState<{
    isValid: boolean;
    errors: string[];
  }>({ isValid: false, errors: [] });
  
  const [stepData, setStepData] = useState<any>({});
  
  // Initialize step data when step changes
  useEffect(() => {
    const currentData = wizardData[currentStepId] || {};
    setStepData(currentData);
    
    // Run validation if step has validator
    const currentStep = steps.find(s => s.id === currentStepId);
    if (currentStep?.validate) {
      const validation = currentStep.validate(currentData);
      setStepValidation(validation);
    } else {
      // Default to valid for steps without validators
      setStepValidation({ isValid: true, errors: [] });
    }
  }, [currentStepId, wizardData, steps]);

  const currentStep = steps.find(step => step.id === currentStepId);
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);
  const totalSteps = steps.length;
  
  // Calculate progress based on completed steps
  const completedCount = completedSteps.size;
  const progressPercentage = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  // Save draft data - defined before functions that use it
  const saveDraft = useCallback((stepId?: string, data?: any) => {
    const targetStepId = stepId || currentStepId;
    const saveData = data || stepData;
    onSaveProgress?.({
      currentStepId: targetStepId,
      completedSteps: Array.from(completedSteps),
      wizardData: {
        ...wizardData,
        [targetStepId]: saveData
      }
    });
  }, [currentStepId, completedSteps, wizardData, stepData, onSaveProgress]);

  const handleNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < totalSteps) {
      const nextStepId = steps[nextIndex].id;
      // Save current step data before navigating
      saveDraft(currentStepId);
      onStepChange(nextStepId);
    } else {
      // Last step - complete wizard
      onWizardComplete(wizardData);
    }
  }, [currentStepIndex, totalSteps, steps, currentStepId, onStepChange, wizardData, onWizardComplete, saveDraft]);

  const handlePreviousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStepId = steps[prevIndex].id;
      // Save current step data before navigating
      saveDraft(currentStepId);
      onStepChange(prevStepId);
    }
  }, [currentStepIndex, steps, currentStepId, onStepChange, saveDraft]);

  const handleCompleteStep = useCallback(() => {
    if (!stepValidation.isValid && !currentStep?.isOptional) {
      return;
    }
    
    onStepComplete(currentStepId, stepData);
    // Note: No auto-advance - let parent decide flow
  }, [stepValidation.isValid, currentStep?.isOptional, currentStepId, stepData, onStepComplete]);

  const handleSkipStep = useCallback(() => {
    if (!currentStep?.canSkip && !currentStep?.isOptional) {
      return;
    }
    
    onStepSkip?.(currentStepId);
    // Note: No auto-advance - let parent decide flow
  }, [currentStep, currentStepId, onStepSkip]);

  const isStepCompleted = (stepId: string) => completedSteps.has(stepId);
  const canProceedToNext = isStepCompleted(currentStepId) || currentStep?.isOptional;
  const isLastStep = currentStepIndex === totalSteps - 1;
  
  // Handle data updates from steps
  const handleSetData = useCallback((data: any) => {
    setStepData(data);
    
    // Run validation if step has validator
    if (currentStep?.validate) {
      const validation = currentStep.validate(data);
      setStepValidation(validation);
    }
  }, [currentStep]);
  
  // Handle validation updates from steps
  const handleSetValid = useCallback((valid: boolean, errors: string[] = []) => {
    setStepValidation({ isValid: valid, errors });
  }, []);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
      handlePreviousStep();
    } else if (e.key === 'ArrowRight' && canProceedToNext) {
      handleNextStep();
    } else if (e.key === 'Enter' && stepValidation.isValid) {
      handleCompleteStep();
    }
  }, [currentStepIndex, canProceedToNext, stepValidation.isValid, handlePreviousStep, handleNextStep, handleCompleteStep]);
  
  // Step context for render-prop
  const stepContext: WizardStepContext = {
    stepId: currentStepId,
    currentData: stepData,
    allData: wizardData,
    isValid: stepValidation.isValid,
    errors: stepValidation.errors,
    setData: handleSetData,
    setValid: handleSetValid,
    onComplete: handleCompleteStep,
    onSkip: handleSkipStep,
    saveDraft
  };

  return (
    <div 
      className={cn("min-h-screen bg-slate-50", className)}
      onKeyDown={handleKeyDown}
      role="application"
      aria-label={`${title} wizard`}
      tabIndex={0}
      autoFocus
      {...divProps}
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-slate-900" data-testid="wizard-title">
                {title}
              </h1>
              <Badge variant="secondary" data-testid="wizard-progress-badge">
                Step {currentStepIndex + 1} of {totalSteps}
              </Badge>
            </div>
            <div className="text-sm text-slate-600" data-testid="wizard-progress-text">
              {Math.round(progressPercentage)}% Complete ({completedCount}/{totalSteps} steps)
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress 
              value={progressPercentage} 
              className="h-2" 
              data-testid="wizard-progress-bar"
              aria-label={`Progress: ${Math.round(progressPercentage)}% complete`}
            />
          </div>
        </div>
      </div>

      {/* Stepper Navigation */}
      {showStepNavigation && (
        <nav className="bg-white border-b border-slate-100" role="navigation" aria-label="Wizard steps">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ol className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = step.id === currentStepId;
                const isCompleted = isStepCompleted(step.id);
                const canNavigate = isCompleted || step.id === currentStepId;
                
                return (
                  <li key={step.id} className="flex items-center">
                    {/* Step Circle */}
                    <div className="flex items-center">
                      <button
                        type="button"
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                          isActive ? "border-blue-600 bg-blue-600 text-white" :
                          isCompleted ? "border-green-500 bg-green-500 text-white hover:bg-green-600" :
                          canNavigate ? "border-slate-300 bg-white text-slate-500 hover:border-slate-400" :
                          "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                        )}
                        disabled={!canNavigate}
                        onClick={() => canNavigate && onStepChange(step.id)}
                        data-testid={`step-circle-${step.id}`}
                        aria-current={isActive ? "step" : undefined}
                        aria-label={`${step.title}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <span aria-hidden="true">{index + 1}</span>
                        )}
                      </button>
                      
                      {/* Step Title (Hidden on mobile) */}
                      <div className="hidden md:block ml-3">
                        <div className={cn(
                          "text-sm font-medium",
                          isActive ? "text-blue-600" :
                          isCompleted ? "text-green-600" :
                          "text-slate-500"
                        )} data-testid={`step-title-${step.id}`}>
                          {step.title}
                          {step.isOptional && (
                            <span className="ml-1 text-xs text-slate-400">(Optional)</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500" data-testid={`step-description-${step.id}`}>
                          {step.description}
                        </div>
                      </div>
                    </div>
                    
                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div 
                        className={cn(
                          "flex-1 h-0.5 mx-4",
                          isCompleted ? "bg-green-500" : "bg-slate-300"
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1 py-8" role="main">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Step Content Card */}
          <Card className="mb-8" data-testid="step-content-card">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900" data-testid="current-step-title">
                    {currentStep?.title}
                    {currentStep?.isOptional && (
                      <Badge variant="outline" className="ml-2">Optional</Badge>
                    )}
                  </h2>
                  <p className="text-slate-600 mt-1" data-testid="current-step-description">
                    {currentStep?.description}
                  </p>
                  
                  {/* Validation Errors */}
                  {!stepValidation.isValid && stepValidation.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Please fix the following issues:</p>
                          <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                            {stepValidation.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Skip Option */}
                {allowSkipping && (currentStep?.canSkip || currentStep?.isOptional) && (
                  <Button
                    variant="ghost"
                    onClick={handleSkipStep}
                    className="text-slate-500 hover:text-slate-700"
                    data-testid="skip-step-button"
                    aria-label="Skip this step"
                  >
                    <SkipForward className="w-4 h-4 mr-2" aria-hidden="true" />
                    Skip this step
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              {/* Render current step with context */}
              {currentStep?.render(stepContext)}
            </CardContent>
          </Card>

          {/* Navigation Footer */}
          <nav className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm border border-slate-200" role="navigation" aria-label="Step navigation">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStepIndex === 0}
              className="flex items-center"
              data-testid="previous-step-button"
              aria-label="Go to previous step"
            >
              <ChevronLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Previous
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-slate-600">
                Step {currentStepIndex + 1} of {totalSteps}
              </div>
              {currentStep?.isOptional && (
                <div className="text-xs text-slate-500 mt-1">
                  This step is optional
                </div>
              )}
              <div className="text-xs text-slate-400 mt-1">
                Use arrow keys to navigate
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Complete Step Button */}
              {!isStepCompleted(currentStepId) && (
                <Button
                  onClick={handleCompleteStep}
                  disabled={!stepValidation.isValid && !currentStep?.isOptional}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300"
                  data-testid="complete-step-button"
                  aria-label="Mark this step as complete"
                >
                  <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                  Complete Step
                </Button>
              )}
              
              {/* Next Button */}
              <Button
                onClick={handleNextStep}
                disabled={!canProceedToNext}
                className="flex items-center"
                data-testid="next-step-button"
                aria-label={isLastStep ? "Complete wizard" : "Go to next step"}
              >
                {isLastStep ? (
                  <>
                    Complete Setup
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </nav>
        </div>
      </main>
    </div>
  );
}

// Example usage component for testing
export function WizardExample() {
  const exampleSteps: WizardStep[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Enter your company details',
      render: (ctx) => (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <input
              type="text"
              value={ctx.currentData.companyName || ''}
              onChange={(e) => {
                const data = { ...ctx.currentData, companyName: e.target.value };
                ctx.setData(data);
                ctx.setValid(!!e.target.value, !e.target.value ? ['Company name is required'] : []);
              }}
              className="w-full p-2 border rounded"
              placeholder="Enter company name"
              data-testid="company-name-input"
            />
          </div>
          <button
            onClick={ctx.onComplete}
            disabled={!ctx.isValid}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
            data-testid="basic-info-complete"
          >
            Complete Basic Info
          </button>
        </div>
      ),
      validate: (data) => ({
        isValid: !!data.companyName,
        errors: !data.companyName ? ['Company name is required'] : []
      })
    },
    {
      id: 'optional-step',
      title: 'Optional Setup',
      description: 'Additional configuration (optional)',
      isOptional: true,
      canSkip: true,
      render: (ctx) => (
        <div className="space-y-4">
          <p>This is an optional step that can be skipped.</p>
          <div className="flex gap-4">
            <button
              onClick={ctx.onComplete}
              className="px-4 py-2 bg-blue-600 text-white rounded"
              data-testid="optional-complete"
            >
              Complete Optional Step
            </button>
            <button
              onClick={ctx.onSkip}
              className="px-4 py-2 bg-gray-400 text-white rounded"
              data-testid="optional-skip"
            >
              Skip This Step
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'final-step',
      title: 'Final Configuration',
      description: 'Complete the setup process',
      render: (ctx) => (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Review Your Information</h3>
            <p>Company: {ctx.allData['basic-info']?.companyName || 'Not provided'}</p>
            <p>Optional step completed: {ctx.allData['optional-step'] ? 'Yes' : 'No'}</p>
          </div>
          <button
            onClick={ctx.onComplete}
            className="px-4 py-2 bg-green-600 text-white rounded"
            data-testid="final-complete"
          >
            Finish Setup
          </button>
        </div>
      )
    }
  ];

  const wizard = useOnboardingWizard(exampleSteps);

  const handleWizardComplete = (allData: Record<string, any>) => {
    console.log('Wizard completed with data:', allData);
    alert('Wizard completed successfully!');
  };

  if (wizard.isWizardComplete) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Setup Complete!</h2>
        <p className="mb-4">Your wizard has been completed successfully.</p>
        <button
          onClick={wizard.resetWizard}
          className="px-4 py-2 bg-blue-600 text-white rounded"
          data-testid="reset-wizard"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <OnboardingWizard
      steps={exampleSteps}
      currentStepId={wizard.currentStepId}
      completedSteps={wizard.completedSteps}
      wizardData={wizard.wizardData}
      title="Test Wizard"
      onStepChange={wizard.setCurrentStepId}
      onStepComplete={wizard.completeStep}
      onStepSkip={wizard.skipStep}
      onWizardComplete={handleWizardComplete}
      onSaveProgress={wizard.saveProgress}
      allowSkipping={true}
      showStepNavigation={true}
      data-testid="wizard-example"
    />
  );
}

// Enhanced hook for managing wizard state
export function useOnboardingWizard(steps: WizardStep[], initialStepId?: string) {
  const firstStepId = steps[0]?.id || '';
  const [currentStepId, setCurrentStepId] = useState(initialStepId || firstStepId);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [wizardData, setWizardData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const completeStep = useCallback((stepId: string, data: any) => {
    setCompletedSteps(prev => new Set([...Array.from(prev), stepId]));
    setWizardData(prev => ({ ...prev, [stepId]: data }));
    
    // Auto-advance to next step
    const currentIndex = steps.findIndex(s => s.id === stepId);
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStepId(steps[nextIndex].id);
    }
  }, [steps]);

  const skipStep = useCallback((stepId: string) => {
    // Auto-advance to next step
    const currentIndex = steps.findIndex(s => s.id === stepId);
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStepId(steps[nextIndex].id);
    }
  }, [steps]);

  const updateWizardData = useCallback((stepId: string, data: any) => {
    setWizardData(prev => ({
      ...prev,
      [stepId]: data
    }));
  }, []);

  const goToStep = useCallback((stepId: string) => {
    const stepExists = steps.some(s => s.id === stepId);
    if (stepExists) {
      setCurrentStepId(stepId);
    }
  }, [steps]);

  const resetWizard = useCallback(() => {
    setCurrentStepId(firstStepId);
    setCompletedSteps(new Set());
    setWizardData({});
    setIsLoading(false);
  }, [firstStepId]);

  const saveProgress = useCallback((data: { 
    currentStepId: string; 
    completedSteps: string[]; 
    wizardData: Record<string, any> 
  }) => {
    setCurrentStepId(data.currentStepId);
    setCompletedSteps(new Set(data.completedSteps));
    setWizardData(data.wizardData);
  }, []);

  const isWizardComplete = completedSteps.size === steps.length;
  const progress = (completedSteps.size / steps.length) * 100;

  return {
    // State
    currentStepId,
    completedSteps,
    wizardData,
    isLoading,
    isWizardComplete,
    progress,
    
    // Actions
    setCurrentStepId: goToStep,
    completeStep,
    skipStep,
    updateWizardData,
    resetWizard,
    saveProgress,
    setIsLoading,
    
    // Utilities
    getCurrentStep: () => steps.find(s => s.id === currentStepId),
    getStepData: (stepId: string) => wizardData[stepId] || {},
    isStepCompleted: (stepId: string) => completedSteps.has(stepId),
  };
}

// Export types for consumers
export type { WizardStep, WizardStepContext, OnboardingWizardProps };