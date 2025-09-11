import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, Building, Users, CreditCard, ArrowRight } from "lucide-react";
import OnboardingWizard, { useOnboardingWizard } from "@/components/OnboardingWizard";
import UnifiedHeader from "@/components/UnifiedHeader";
import { apiRequest } from "@/lib/queryClient";
import signedworkLogo from "@assets/Signed-work-Logo (1)_1755168042120.png";

// Welcome Step Component
function WelcomeStep({ context }: { context: any }) {
  const { onComplete } = context;
  const [isReady, setIsReady] = useState(false);

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex justify-center mb-6">
          <img src={signedworkLogo} alt="Signedwork" className="h-16 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900" data-testid="welcome-title">
          Welcome to Signedwork! 🎉
        </h1>
        <p className="text-xl text-slate-600" data-testid="welcome-subtitle">
          You've successfully created your company account. Let's set up your organization in just a few quick steps.
        </p>
      </div>

      {/* What's Next Preview */}
      <Card className="text-left">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
            Here's what we'll help you set up:
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Organization Details</h4>
                <p className="text-sm text-slate-600">Company size, industry, and goals</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Team Structure</h4>
                <p className="text-sm text-slate-600">Set up roles and invite team members</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Perfect Plan</h4>
                <p className="text-sm text-slate-600">We'll recommend the best plan for your needs</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CreditCard className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Secure Payment</h4>
                <p className="text-sm text-slate-600">Quick and secure payment setup</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Estimate */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-2 text-blue-800">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span className="font-medium">Estimated time: 5-7 minutes</span>
        </div>
        <p className="text-blue-700 text-sm mt-2 text-center">
          You can save your progress and complete this later if needed
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button
          onClick={() => {
            setIsReady(true);
            onComplete();
          }}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          data-testid="start-setup-button"
        >
          Let's Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            // Navigate to company dashboard, skipping onboarding
            setLocation("/company-dashboard");
          }}
          data-testid="skip-setup-button"
        >
          Skip for now
        </Button>
      </div>

      {/* Trust Indicators */}
      <div className="pt-8 border-t border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm text-slate-600">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Secure & Private</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Save Progress Anytime</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>No Hidden Fees</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder components for other steps (we'll build these next)
function OrganizationDetailsStep({ context }: { context: any }) {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-bold">Organization Details</h2>
      <p className="text-slate-600">Tell us about your company...</p>
      <Button onClick={context.onComplete}>Complete Step</Button>
    </div>
  );
}

function TeamSetupStep({ context }: { context: any }) {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-bold">Team Setup</h2>
      <p className="text-slate-600">Set up your team structure...</p>
      <Button onClick={context.onComplete}>Complete Step</Button>
    </div>
  );
}

function PlanSelectionStep({ context }: { context: any }) {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-bold">Plan Selection</h2>
      <p className="text-slate-600">Choose the perfect plan...</p>
      <Button onClick={context.onComplete}>Complete Step</Button>
    </div>
  );
}

function PaymentStep({ context }: { context: any }) {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-bold">Payment Setup</h2>
      <p className="text-slate-600">Secure payment processing...</p>
      <Button onClick={context.onComplete}>Complete Step</Button>
    </div>
  );
}

export default function CompanyOnboarding() {
  // Define wizard steps first
  const wizardSteps = [
    {
      id: "welcome",
      title: "Welcome",
      description: "Getting started with your setup",
      isOptional: false,
      render: (context: any) => <WelcomeStep context={context} />
    },
    {
      id: "organization",
      title: "Organization",
      description: "Company details and structure",
      isOptional: false,
      render: (context: any) => <OrganizationDetailsStep context={context} />
    },
    {
      id: "team-setup",
      title: "Team Setup",
      description: "Roles and team members",
      isOptional: true,
      render: (context: any) => <TeamSetupStep context={context} />
    },
    {
      id: "plan-selection",
      title: "Plan Selection",
      description: "Choose your perfect plan",
      isOptional: false,
      render: (context: any) => <PlanSelectionStep context={context} />
    },
    {
      id: "payment",
      title: "Payment",
      description: "Secure payment setup",
      isOptional: false,
      render: (context: any) => <PaymentStep context={context} />
    }
  ];

  const {
    currentStepId,
    setCurrentStepId,
    completedSteps,
    completeStep,
    wizardData,
    updateWizardData,
    progress,
    isWizardComplete,
    saveProgress
  } = useOnboardingWizard(wizardSteps, "welcome");

  const handleStepComplete = (stepId: string, data: any) => {
    completeStep(stepId, data);
    // Save progress to backend
    saveProgress({
      currentStepId,
      completedSteps: Array.from(completedSteps),
      wizardData: { ...wizardData, [stepId]: data }
    });
  };

  const handleWizardComplete = () => {
    console.log("Onboarding complete!", { wizardData });
    // Redirect to dashboard or completion page
    // setLocation("/company-dashboard");
  };

  const handleSaveProgress = (data: any) => {
    console.log("Saving progress:", data);
    // API call to save progress to backend
    // apiRequest("POST", "/api/companies/onboarding/progress", data);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <UnifiedHeader 
        showAuthButtons={false}
currentPage="landing"
      />
      
      <OnboardingWizard
        steps={wizardSteps}
        currentStepId={currentStepId}
        completedSteps={completedSteps}
        wizardData={wizardData}
        onStepChange={setCurrentStepId}
        onStepComplete={handleStepComplete}
        onWizardComplete={handleWizardComplete}
        onSaveProgress={handleSaveProgress}
        allowSkipping={true}
        showStepNavigation={true}
        className="pt-0"
        data-testid="company-onboarding-wizard"
      />
    </div>
  );
}