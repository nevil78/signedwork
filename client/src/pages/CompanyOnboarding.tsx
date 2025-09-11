import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, Sparkles, Building, Users, CreditCard, ArrowRight, Target, TrendingUp, Shield, Zap } from "lucide-react";
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

// Organization Details Form Schema
const organizationDetailsSchema = z.object({
  companySize: z.string().min(1, "Please select your company size"),
  industry: z.string().min(1, "Please select your industry"),
  primaryGoals: z.array(z.string()).min(1, "Please select at least one primary goal"),
  teamStructure: z.string().min(1, "Please select your team structure"),
});

type OrganizationDetailsData = z.infer<typeof organizationDetailsSchema>;

function OrganizationDetailsStep({ context }: { context: any }) {
  const form = useForm<OrganizationDetailsData>({
    resolver: zodResolver(organizationDetailsSchema),
    defaultValues: {
      companySize: context.wizardData?.organization?.companySize || "",
      industry: context.wizardData?.organization?.industry || "",
      primaryGoals: context.wizardData?.organization?.primaryGoals || [],
      teamStructure: context.wizardData?.organization?.teamStructure || "",
    },
  });

  const onSubmit = (data: OrganizationDetailsData) => {
    // Pass the organization data to the wizard
    context.onComplete(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-3">
            <Building className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Tell us about your organization</h2>
        <p className="text-lg text-slate-600">
          This helps us customize Signedwork to fit your business needs
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              
              {/* Company Size */}
              <FormField
                control={form.control}
                name="companySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">How many people work at your company?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-company-size">
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This helps us recommend the right plan and features for your team size
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Industry */}
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">What industry are you in?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-industry">
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technology">Technology & Software</SelectItem>
                        <SelectItem value="finance">Finance & Banking</SelectItem>
                        <SelectItem value="healthcare">Healthcare & Medical</SelectItem>
                        <SelectItem value="education">Education & Training</SelectItem>
                        <SelectItem value="retail">Retail & E-commerce</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing & Industrial</SelectItem>
                        <SelectItem value="consulting">Consulting & Professional Services</SelectItem>
                        <SelectItem value="marketing">Marketing & Advertising</SelectItem>
                        <SelectItem value="real-estate">Real Estate & Construction</SelectItem>
                        <SelectItem value="media">Media & Entertainment</SelectItem>
                        <SelectItem value="non-profit">Non-profit & Government</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      We'll suggest industry-specific features and best practices
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Primary Goals */}
              <FormField
                control={form.control}
                name="primaryGoals"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">What are your primary goals? (Select all that apply)</FormLabel>
                    <FormDescription className="mb-4">
                      This helps us prioritize the right features and setup for your needs
                    </FormDescription>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: "track-productivity", label: "Track team productivity", icon: TrendingUp },
                        { id: "manage-projects", label: "Manage projects & tasks", icon: Target },
                        { id: "verify-work", label: "Verify completed work", icon: Shield },
                        { id: "payroll-timesheet", label: "Payroll & timesheet management", icon: Users },
                        { id: "hire-freelancers", label: "Hire freelancers & contractors", icon: Zap },
                        { id: "compliance-reporting", label: "Compliance & reporting", icon: CheckCircle },
                      ].map((goal) => (
                        <FormField
                          key={goal.id}
                          control={form.control}
                          name="primaryGoals"
                          render={({ field }) => {
                            const IconComponent = goal.icon;
                            return (
                              <FormItem key={goal.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    id={goal.id}
                                    checked={field.value?.includes(goal.id)}
                                    onCheckedChange={(checked) => {
                                      return checked === true
                                        ? field.onChange([...field.value, goal.id])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== goal.id)
                                          )
                                    }}
                                    data-testid={`checkbox-goal-${goal.id}`}
                                  />
                                </FormControl>
                                <div className="flex items-center space-x-3">
                                  <IconComponent className="h-5 w-5 text-blue-600" />
                                  <FormLabel htmlFor={goal.id} className="text-sm font-normal cursor-pointer">
                                    {goal.label}
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Team Structure */}
              <FormField
                control={form.control}
                name="teamStructure"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium">How is your team currently organized?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 gap-4"
                      >
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50">
                          <RadioGroupItem value="flat" id="flat" data-testid="radio-structure-flat" />
                          <Label htmlFor="flat" className="flex-1 cursor-pointer">
                            <div className="font-medium">Flat structure</div>
                            <div className="text-sm text-slate-600">Everyone reports to leadership directly</div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50">
                          <RadioGroupItem value="departments" id="departments" data-testid="radio-structure-departments" />
                          <Label htmlFor="departments" className="flex-1 cursor-pointer">
                            <div className="font-medium">Departments/Teams</div>
                            <div className="text-sm text-slate-600">Organized into functional departments or project teams</div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50">
                          <RadioGroupItem value="hierarchical" id="hierarchical" data-testid="radio-structure-hierarchical" />
                          <Label htmlFor="hierarchical" className="flex-1 cursor-pointer">
                            <div className="font-medium">Multi-level hierarchy</div>
                            <div className="text-sm text-slate-600">Multiple management levels with branches/divisions</div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50">
                          <RadioGroupItem value="mixed" id="mixed" data-testid="radio-structure-mixed" />
                          <Label htmlFor="mixed" className="flex-1 cursor-pointer">
                            <div className="font-medium">Mixed/Flexible</div>
                            <div className="text-sm text-slate-600">Combination of structures or still deciding</div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      This helps us set up the right organizational structure in your account
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={context.onPrevious}
              data-testid="button-previous-step"
            >
              Back
            </Button>
            <Button 
              type="submit"
              data-testid="button-continue-step"
            >
              Continue Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
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