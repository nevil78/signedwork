import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Sparkles, Building, Users, CreditCard, ArrowRight, ArrowLeft, Target, TrendingUp, Shield, Zap, UserPlus, Mail, Crown, User, Settings, Plus, X, Loader2, Star, ThumbsUp, Brain } from "lucide-react";
import OnboardingWizard, { useOnboardingWizard } from "@/components/OnboardingWizard";
import UnifiedHeader from "@/components/UnifiedHeader";
import { RazorpayCheckout } from "@/components/RazorpayCheckout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import signedworkLogo from "@assets/Signed-work-Logo (1)_1755168042120.png";

// Enhanced validation utilities
interface ValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldStates: Record<string, 'error' | 'warning' | 'success' | 'default'>;
}

// Enhanced field state helper
const getEnhancedFieldClass = (fieldState: any, customState?: 'error' | 'warning' | 'success') => {
  if (customState === 'error' || fieldState?.error) {
    return "field-error";
  }
  if (customState === 'success') {
    return "field-success";
  }
  if (customState === 'warning') {
    return "field-warning";
  }
  return "";
};

// Async validation for plan availability
const validatePlanAvailability = async (planId: string): Promise<{ isValid: boolean; message?: string }> => {
  try {
    const response = await apiRequest("GET", `/api/payments/plans/${planId}/availability`);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      message: "This plan is currently unavailable. Please select a different plan." 
    };
  }
};

// Enhanced validation messages
const getValidationMessage = (field: string, value: any): string => {
  const messages: Record<string, string> = {
    companySize: "Please select your company size to help us recommend the best plan for you",
    industry: "Your industry helps us customize features and provide relevant insights",
    primaryGoals: "Select at least one goal so we can prioritize the right features for your team", 
    teamStructure: "Understanding your team structure helps us set up the right permissions",
    selectedPlan: "Please choose a plan that fits your organization's needs",
    initialRoles: "Add at least one role to define your team structure"
  };
  
  return messages[field] || `Please provide a valid ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
};

// Welcome Step Component
function WelcomeStep({ context }: { context: any }) {
  const { onComplete } = context;
  const [isReady, setIsReady] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8 px-4">
      {/* Hero Section */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex justify-center mb-4 md:mb-6">
          <img src={signedworkLogo} alt="Signedwork" className="h-12 md:h-16 w-auto" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900" data-testid="welcome-title">
          Welcome to Signedwork! 🎉
        </h1>
        <p className="text-lg md:text-xl text-slate-600 px-4" data-testid="welcome-subtitle">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="flex items-start space-x-3 p-2 sm:p-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm md:text-base">Organization Details</h4>
                <p className="text-xs md:text-sm text-slate-600">Company size, industry, and goals</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-2 sm:p-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm md:text-base">Team Structure</h4>
                <p className="text-xs md:text-sm text-slate-600">Set up roles and invite team members</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-2 sm:p-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm md:text-base">Perfect Plan</h4>
                <p className="text-xs md:text-sm text-slate-600">We'll recommend the best plan for your needs</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-2 sm:p-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CreditCard className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm md:text-base">Secure Payment</h4>
                <p className="text-xs md:text-sm text-slate-600">Quick and secure payment setup</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Estimate */}
      <div className="bg-blue-50 rounded-lg p-4 md:p-6">
        <div className="flex items-center justify-center space-x-2 text-blue-800">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span className="font-medium text-sm md:text-base">Estimated time: 5-7 minutes</span>
        </div>
        <p className="text-blue-700 text-xs md:text-sm mt-2 text-center px-2">
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

// Enhanced Organization Details Form Schema with better error messages
const organizationDetailsSchema = z.object({
  companySize: z.string().min(1, "Please select your company size to help us recommend the best plan for you"),
  industry: z.string().min(1, "Your industry helps us customize features and provide relevant insights"),
  primaryGoals: z.array(z.string()).min(1, "Select at least one goal so we can prioritize the right features for your team"),
  teamStructure: z.string().min(1, "Understanding your team structure helps us set up the right permissions"),
}).refine((data) => {
  // Cross-validation: Large companies should consider enterprise features
  if ((data.companySize === '201-500' || data.companySize === '501-1000' || data.companySize === '1000+') && 
      !data.primaryGoals.includes('enterprise-management')) {
    return true; // Still valid, but we can show a helpful suggestion
  }
  return true;
}, {
  message: "For larger organizations, consider enterprise management features for better control",
  path: ["primaryGoals"]
});

type OrganizationDetailsData = z.infer<typeof organizationDetailsSchema>;

function OrganizationDetailsStep({ context }: { context: any }) {
  const { toast } = useToast();
  const form = useForm<OrganizationDetailsData>({
    resolver: zodResolver(organizationDetailsSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      companySize: context.wizardData?.organization?.companySize || "",
      industry: context.wizardData?.organization?.industry || "",
      primaryGoals: context.wizardData?.organization?.primaryGoals || [],
      teamStructure: context.wizardData?.organization?.teamStructure || "",
    },
  });

  // Watch all form values for real-time validation
  const watchedValues = useWatch({ control: form.control });
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    errors: [],
    warnings: [],
    fieldStates: {}
  });

  // Real-time validation with useEffect
  useEffect(() => {
    const { companySize, industry, primaryGoals, teamStructure } = watchedValues;
    const newState: ValidationState = {
      isValid: true,
      errors: [],
      warnings: [],
      fieldStates: {}
    };

    // Set field states based on completion
    newState.fieldStates.companySize = companySize ? 'success' : 'default';
    newState.fieldStates.industry = industry ? 'success' : 'default';
    newState.fieldStates.primaryGoals = primaryGoals?.length > 0 ? 'success' : 'default';
    newState.fieldStates.teamStructure = teamStructure ? 'success' : 'default';

    // Generate helpful warnings for large companies
    if ((companySize === '201-500' || companySize === '501-1000' || companySize === '1000+') && 
        !primaryGoals?.includes('enterprise-management')) {
      newState.warnings.push('For larger organizations, consider enterprise management features for better control and compliance.');
    }

    // Industry-specific suggestions
    if (industry === 'healthcare' && !primaryGoals?.includes('compliance-reporting')) {
      newState.warnings.push('Healthcare organizations often benefit from compliance and reporting features.');
    }

    if (industry === 'finance' && !primaryGoals?.includes('verify-work')) {
      newState.warnings.push('Financial services typically require robust work verification systems.');
    }

    setValidationState(newState);
  }, [watchedValues]);

  const onSubmit = (data: OrganizationDetailsData) => {
    // Show success toast
    toast({
      title: "Organization details saved!",
      description: "Your information helps us customize the perfect setup for you.",
    });
    
    // Pass the organization data to the wizard
    context.onComplete(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 px-4">
      {/* Header */}
      <div className="text-center space-y-3 md:space-y-4">
        <div className="flex items-center justify-center mb-3 md:mb-4">
          <div className="bg-blue-100 rounded-full p-2 md:p-3">
            <Building className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-xl md:text-3xl font-bold text-slate-900">Tell us about your organization</h2>
        <p className="text-sm md:text-lg text-slate-600 px-2">
          This helps us customize Signedwork to fit your business needs
        </p>
      </div>

      {/* Enhanced validation warnings */}
      {validationState.warnings.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="space-y-2">
              {validationState.warnings.map((warning, index) => (
                <p key={index} className="text-sm text-orange-700 flex items-start gap-2">
                  <span className="text-orange-500">⚠️</span>
                  {warning}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              
              {/* Company Size */}
              <FormField
                control={form.control}
                name="companySize"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">How many people work at your company?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          data-testid="select-company-size"
                          className={getEnhancedFieldClass(fieldState, validationState.fieldStates.companySize)}
                        >
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

// Enhanced Team Setup Form Schema with better validation
const teamSetupSchema = z.object({
  initialRoles: z.array(z.object({
    title: z.string()
      .min(1, "Role title is required")
      .min(2, "Role title must be at least 2 characters")
      .max(50, "Role title must be less than 50 characters")
      .refine((title) => /^[a-zA-Z\s\-]+$/.test(title), {
        message: "Role title can only contain letters, spaces, and hyphens"
      }),
    department: z.string().optional(),
    description: z.string()
      .max(200, "Description must be less than 200 characters")
      .optional(),
  })).min(1, "Add at least one role to define your team structure")
    .max(20, "Maximum 20 roles allowed for initial setup"),
  teamStructure: z.string().min(1, "Please select how you want to structure your team"),
  invitations: z.array(z.object({
    email: z.string()
      .email("Please enter a valid email address")
      .refine(async (email) => {
        // Basic domain validation
        const domain = email.split('@')[1];
        return domain && domain.includes('.');
      }, "Please use a valid email domain"),
    role: z.string().min(1, "Please assign a role to this invitation"),
    message: z.string()
      .max(500, "Personal message must be less than 500 characters")
      .optional(),
  })).optional(),
  setupLater: z.boolean().optional(),
}).refine((data) => {
  // Cross-validation: If not setting up later, require proper team structure
  if (!data.setupLater) {
    return data.initialRoles.length > 0;
  }
  return true;
}, {
  message: "Please add at least one role or choose to set up your team later",
  path: ["initialRoles"]
}).refine((data) => {
  // Validation: Check for duplicate role titles
  if (data.initialRoles) {
    const titles = data.initialRoles.map(role => role.title.toLowerCase().trim());
    const uniqueTitles = new Set(titles);
    return titles.length === uniqueTitles.size;
  }
  return true;
}, {
  message: "Role titles must be unique. Please use different names for each role",
  path: ["initialRoles"]
});

type TeamSetupData = z.infer<typeof teamSetupSchema>;

function TeamSetupStep({ context }: { context: any }) {
  const { toast } = useToast();
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    errors: [],
    warnings: [],
    fieldStates: {}
  });
  const [isValidatingEmails, setIsValidatingEmails] = useState(false);
  
  const form = useForm<TeamSetupData>({
    resolver: zodResolver(teamSetupSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      initialRoles: context.wizardData?.teamSetup?.initialRoles || [{ title: "", department: "", description: "" }],
      teamStructure: context.wizardData?.teamSetup?.teamStructure || "",
      invitations: context.wizardData?.teamSetup?.invitations || [],
      setupLater: context.wizardData?.teamSetup?.setupLater || false,
    },
  });

  const rolesFieldArray = useFieldArray({
    control: form.control,
    name: "initialRoles"
  });

  const invitationsFieldArray = useFieldArray({
    control: form.control,
    name: "invitations"
  });

  const watchSetupLater = useWatch({ control: form.control, name: "setupLater" });
  const watchCurrentRoles = useWatch({ control: form.control, name: "initialRoles" });

  // Mutation for sending invitations
  const sendInvitationsMutation = useMutation({
    mutationFn: async (invitations: any[]) => {
      return apiRequest("POST", "/api/company/invitations", { invitations });
    },
    onSuccess: (response) => {
      toast({
        title: "Invitations sent successfully! 📧",
        description: `${response.count} invitation(s) have been sent to your team members.`,
      });
    },
    onError: (error: any) => {
      console.error("Send invitations error:", error);
      toast({
        title: "Failed to send invitations",
        description: error.message || "An error occurred while sending invitations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: TeamSetupData) => {
    if (data.setupLater) {
      // If setup later is checked, pass minimal data
      context.onComplete({ setupLater: true });
      return;
    }

    try {
      // If there are invitations to send, call the API
      if (data.invitations && data.invitations.length > 0) {
        // Filter out invitations with empty emails
        const validInvitations = data.invitations.filter(inv => inv.email && inv.email.trim() !== '');
        
        if (validInvitations.length > 0) {
          const response = await sendInvitationsMutation.mutateAsync(validInvitations);
          
          // Pass full team setup data with invitation response
          context.onComplete({
            ...data,
            invitationResponse: response,
            invitationsSent: validInvitations.length
          });
        } else {
          // No valid invitations, just pass the data
          context.onComplete(data);
        }
      } else {
        // No invitations, just pass the data
        context.onComplete(data);
      }
    } catch (error) {
      // Error is already handled by the mutation, but we don't want to proceed
      console.error("Error in team setup:", error);
    }
  };

  // Common role suggestions based on company size from previous step
  const getRoleSuggestions = () => {
    const orgData = context.wizardData?.organization;
    const size = orgData?.companySize;
    
    if (size === "1-10") {
      return ["Founder/CEO", "Developer", "Designer", "Sales", "Marketing"];
    } else if (size === "11-50") {
      return ["CEO/Manager", "Team Lead", "Developer", "Designer", "Sales Manager", "HR Coordinator", "Marketing Specialist"];
    } else {
      return ["CEO", "Department Head", "Team Lead", "Manager", "Senior Developer", "HR Manager", "Sales Director", "Marketing Manager"];
    }
  };

  const roleSuggestions = getRoleSuggestions();

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 px-4">
      {/* Header */}
      <div className="text-center space-y-3 md:space-y-4">
        <div className="flex items-center justify-center mb-3 md:mb-4">
          <div className="bg-green-100 rounded-full p-2 md:p-3">
            <Users className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-xl md:text-3xl font-bold text-slate-900">Set up your team structure</h2>
        <p className="text-sm md:text-lg text-slate-600 px-2">
          Define key roles and invite your initial team members to get started
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Setup Later Option */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="setupLater"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-setup-later"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base font-medium">
                        Skip team setup for now
                      </FormLabel>
                      <FormDescription>
                        You can set up your team structure and invite members later from your dashboard
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {!watchSetupLater && (
            <>
              {/* Team Structure */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Team Organization
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to organize your team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="teamStructure"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 gap-4"
                          >
                            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50">
                              <RadioGroupItem value="single-team" id="single-team" data-testid="radio-team-single" />
                              <Label htmlFor="single-team" className="flex-1 cursor-pointer">
                                <div className="font-medium">Single team</div>
                                <div className="text-sm text-slate-600">Everyone works together as one team</div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50">
                              <RadioGroupItem value="departments" id="dept" data-testid="radio-team-departments" />
                              <Label htmlFor="dept" className="flex-1 cursor-pointer">
                                <div className="font-medium">Multiple departments</div>
                                <div className="text-sm text-slate-600">Organize by functional departments (Engineering, Sales, etc.)</div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50">
                              <RadioGroupItem value="project-teams" id="projects" data-testid="radio-team-projects" />
                              <Label htmlFor="projects" className="flex-1 cursor-pointer">
                                <div className="font-medium">Project-based teams</div>
                                <div className="text-sm text-slate-600">Create teams around specific projects or clients</div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Key Roles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Define Key Roles
                  </CardTitle>
                  <CardDescription>
                    Add the main roles and positions you need in your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Role Suggestions */}
                  <div className="p-3 md:p-4 bg-slate-50 rounded-lg">
                    <Label className="text-sm font-medium mb-2 md:mb-3 block">Quick suggestions based on your company size:</Label>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {roleSuggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 min-h-[44px] md:min-h-auto"
                          onClick={() => {
                            const currentRoles = rolesFieldArray.fields;
                            const emptyIndex = currentRoles.findIndex((_, index) => {
                              const roleValue = form.getValues(`initialRoles.${index}.title`);
                              return !roleValue || roleValue.trim() === "";
                            });
                            
                            if (emptyIndex >= 0) {
                              form.setValue(`initialRoles.${emptyIndex}.title`, suggestion);
                            } else {
                              rolesFieldArray.append({ title: suggestion, department: "", description: "" });
                            }
                          }}
                          data-testid={`button-role-suggestion-${suggestion.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        >
                          <Plus className="w-3 h-3 mr-0.5 md:mr-1" />
                          <span className="truncate">{suggestion}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Role List */}
                  <div className="space-y-3 md:space-y-4">
                    {rolesFieldArray.fields.map((field, index) => (
                      <div key={field.id} className="p-3 md:p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm md:text-base">Role {index + 1}</h4>
                          {rolesFieldArray.fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="min-h-[44px] md:min-h-auto h-9"
                              onClick={() => rolesFieldArray.remove(index)}
                              data-testid={`button-remove-role-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <FormField
                            control={form.control}
                            name={`initialRoles.${index}.title`}
                            render={({ field: fieldProps }) => (
                              <FormItem>
                                <FormLabel htmlFor={`role-title-${index}`}>Role Title *</FormLabel>
                                <FormControl>
                                  <Input
                                    id={`role-title-${index}`}
                                    placeholder="e.g., Senior Developer"
                                    {...fieldProps}
                                    data-testid={`input-role-title-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`initialRoles.${index}.department`}
                            render={({ field: fieldProps }) => (
                              <FormItem>
                                <FormLabel htmlFor={`role-department-${index}`}>Department (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    id={`role-department-${index}`}
                                    placeholder="e.g., Engineering"
                                    {...fieldProps}
                                    data-testid={`input-role-department-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`initialRoles.${index}.description`}
                          render={({ field: fieldProps }) => (
                            <FormItem>
                              <FormLabel htmlFor={`role-description-${index}`}>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  id={`role-description-${index}`}
                                  placeholder="Brief description of responsibilities..."
                                  className="min-h-[80px]"
                                  {...fieldProps}
                                  data-testid={`textarea-role-description-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => rolesFieldArray.append({ title: "", department: "", description: "" })}
                    className="w-full h-11 text-sm md:text-base"
                    data-testid="button-add-role"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Role
                  </Button>
                </CardContent>
              </Card>

              {/* Team Invitations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Invite Initial Team Members
                  </CardTitle>
                  <CardDescription>
                    Send invitations to your first team members (optional - you can do this later)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  {invitationsFieldArray.fields.length === 0 ? (
                    <div className="text-center py-4 md:py-6 bg-slate-50 rounded-lg">
                      <Mail className="h-6 w-6 md:h-8 md:w-8 text-slate-400 mx-auto mb-2 md:mb-3" />
                      <p className="text-slate-600 mb-3 md:mb-4 text-sm md:text-base">No invitations added yet</p>
                      <Button
                        type="button"
                        onClick={() => invitationsFieldArray.append({ email: "", role: "", message: "" })}
                        className="h-11"
                        data-testid="button-add-first-invitation"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Send Your First Invitation
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 md:space-y-4">
                        {invitationsFieldArray.fields.map((field, index) => {
                          const availableRoles = watchCurrentRoles?.filter((role: any) => role?.title && role.title.trim()) || [];
                          
                          return (
                            <div key={field.id} className="p-3 md:p-4 border rounded-lg space-y-3">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-sm md:text-base">Invitation {index + 1}</h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="min-h-[44px] md:min-h-auto h-9"
                                  onClick={() => invitationsFieldArray.remove(index)}
                                  data-testid={`button-remove-invitation-${index}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                <FormField
                                  control={form.control}
                                  name={`invitations.${index}.email`}
                                  render={({ field: fieldProps }) => (
                                    <FormItem>
                                      <FormLabel htmlFor={`invitation-email-${index}`}>Email Address *</FormLabel>
                                      <FormControl>
                                        <Input
                                          id={`invitation-email-${index}`}
                                          type="email"
                                          placeholder="colleague@example.com"
                                          {...fieldProps}
                                          data-testid={`input-invitation-email-${index}`}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`invitations.${index}.role`}
                                  render={({ field: fieldProps }) => (
                                    <FormItem>
                                      <FormLabel htmlFor={`invitation-role-${index}`}>Role *</FormLabel>
                                      <Select
                                        onValueChange={fieldProps.onChange}
                                        value={fieldProps.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger data-testid={`select-invitation-role-${index}`}>
                                            <SelectValue placeholder="Select role" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {availableRoles.map((role: any, roleIndex: number) => (
                                            <SelectItem key={`${role.title}-${roleIndex}`} value={role.title}>
                                              {role.title}
                                            </SelectItem>
                                          ))}
                                          {availableRoles.length === 0 && (
                                            <SelectItem value="team-member">Team Member</SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <FormField
                                control={form.control}
                                name={`invitations.${index}.message`}
                                render={({ field: fieldProps }) => (
                                  <FormItem>
                                    <FormLabel htmlFor={`invitation-message-${index}`}>Personal Message (Optional)</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        id={`invitation-message-${index}`}
                                        placeholder="Hi! I'd love to have you join our team at..."
                                        className="min-h-[80px]"
                                        {...fieldProps}
                                        data-testid={`textarea-invitation-message-${index}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => invitationsFieldArray.append({ email: "", role: "", message: "" })}
                        className="w-full h-11 text-sm md:text-base"
                        data-testid="button-add-invitation"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Invitation
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between pt-4 md:pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={context.onPrevious}
              disabled={sendInvitationsMutation.isPending}
              className="w-full sm:w-auto h-11 order-2 sm:order-1"
              data-testid="button-previous-step"
            >
              Back
            </Button>
            <Button 
              type="submit"
              disabled={sendInvitationsMutation.isPending}
              className="w-full sm:w-auto h-11 order-1 sm:order-2"
              data-testid="button-continue-step"
            >
              {sendInvitationsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Invitations...
                </>
              ) : (
                <>
                  {watchSetupLater ? "Skip Team Setup" : "Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// Enhanced Plan Selection Form Schema with async validation
const planSelectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("selected"),
    selectedPlan: z.string()
      .min(1, "Please choose a plan that fits your organization's needs")
      .refine(async (planId) => {
        // Async validation for plan availability
        const validation = await validatePlanAvailability(planId);
        return validation.isValid;
      }, {
        message: "This plan is currently unavailable. Please select a different plan."
      }),
    customizeFeatures: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("skipped"),
    skipped: z.literal(true),
    reason: z.string()
      .min(1, "Please provide a brief reason for skipping plan selection")
      .max(200, "Reason must be less than 200 characters")
      .optional(),
  })
]);

type PlanSelectionData = z.infer<typeof planSelectionSchema>;

interface SubscriptionPlan {
  id: string;
  planId: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  features: string[];
  maxEmployees?: number;
  maxWorkEntries?: number;
  isActive: boolean;
}


// Plan Recommendation Algorithm
const getRecommendedPlan = (organizationData: any, plans: SubscriptionPlan[]) => {
  if (!organizationData || plans.length === 0) return null;

  const { companySize, primaryGoals, industry } = organizationData;
  
  // Score each plan based on company requirements
  const planScores = plans.map(plan => {
    let score = 0;
    let reasons = [];

    // Company Size Scoring
    if (companySize === "1-10") {
      if (plan.planId === "PLAN-BASIC") {
        score += 40;
        reasons.push("Perfect for small teams starting out");
      } else if (plan.planId === "PLAN-PRO") {
        score += 25;
        reasons.push("Room for growth as your team expands");
      }
    } else if (companySize === "11-50") {
      if (plan.planId === "PLAN-PRO") {
        score += 40;
        reasons.push("Ideal size range for Pro plan features");
      } else if (plan.planId === "PLAN-BASIC") {
        score += 15;
        reasons.push("May be limiting for larger teams");
      } else if (plan.planId === "PLAN-ENTERPRISE") {
        score += 25;
        reasons.push("Full feature set for growing company");
      }
    } else if (companySize === "51-200" || companySize === "201-500") {
      if (plan.planId === "PLAN-ENTERPRISE") {
        score += 40;
        reasons.push("Designed for large organizations");
      } else if (plan.planId === "PLAN-PRO") {
        score += 30;
        reasons.push("Good feature set but may need more capacity");
      }
    } else if (companySize === "501-1000" || companySize === "1000+") {
      if (plan.planId === "PLAN-ENTERPRISE") {
        score += 45;
        reasons.push("Essential for enterprise-scale operations");
      }
    }

    // Primary Goals Scoring
    if (primaryGoals?.includes("verify-work")) {
      if (plan.planId === "PLAN-PRO" || plan.planId === "PLAN-ENTERPRISE") {
        score += 20;
        reasons.push("Includes verified work entries feature");
      }
    }
    
    if (primaryGoals?.includes("track-productivity")) {
      if (plan.planId === "PLAN-PRO" || plan.planId === "PLAN-ENTERPRISE") {
        score += 15;
        reasons.push("Advanced analytics for productivity tracking");
      }
    }
    
    if (primaryGoals?.includes("compliance-reporting")) {
      if (plan.planId === "PLAN-ENTERPRISE") {
        score += 25;
        reasons.push("Advanced security and reporting features");
      }
    }
    
    if (primaryGoals?.includes("hire-freelancers")) {
      if (plan.planId === "PLAN-PRO" || plan.planId === "PLAN-ENTERPRISE") {
        score += 15;
        reasons.push("Team management for freelancers");
      }
    }

    // Industry-specific scoring - comprehensive rules for all industries
    switch (industry) {
      case "finance":
        if (plan.planId === "PLAN-ENTERPRISE") {
          score += 30;
          reasons.push("Essential compliance and security features for financial services");
        } else if (plan.planId === "PLAN-PRO") {
          score += 20;
          reasons.push("Good compliance features, but Enterprise recommended for full regulatory support");
        }
        break;
        
      case "healthcare":
        if (plan.planId === "PLAN-ENTERPRISE") {
          score += 35;
          reasons.push("HIPAA compliance and advanced security features required for healthcare");
        } else if (plan.planId === "PLAN-PRO") {
          score += 15;
          reasons.push("Basic security features, but Enterprise recommended for healthcare compliance");
        }
        break;
        
      case "technology":
        if (plan.planId === "PLAN-PRO") {
          score += 25;
          reasons.push("Perfect for growing tech teams with analytics and scalability features");
        } else if (plan.planId === "PLAN-ENTERPRISE") {
          score += 20;
          reasons.push("Advanced features for large tech organizations");
        } else if (plan.planId === "PLAN-BASIC") {
          score += 10;
          reasons.push("Good for tech startups, but Pro recommended for growth");
        }
        break;
        
      case "consulting":
        if (plan.planId === "PLAN-PRO") {
          score += 30;
          reasons.push("Ideal for professional services with time tracking and team management");
        } else if (plan.planId === "PLAN-ENTERPRISE") {
          score += 20;
          reasons.push("Advanced features for large consulting firms");
        }
        break;
        
      case "manufacturing":
        if (plan.planId === "PLAN-ENTERPRISE") {
          score += 25;
          reasons.push("Complex workforce management and compliance features for manufacturing");
        } else if (plan.planId === "PLAN-PRO") {
          score += 20;
          reasons.push("Good team management, but Enterprise recommended for large operations");
        }
        break;
        
      case "real-estate":
        if (plan.planId === "PLAN-ENTERPRISE") {
          score += 25;
          reasons.push("Transaction tracking and compliance features for real estate");
        } else if (plan.planId === "PLAN-PRO") {
          score += 20;
          reasons.push("Good project management for real estate teams");
        }
        break;
        
      case "marketing":
        if (plan.planId === "PLAN-PRO") {
          score += 25;
          reasons.push("Collaboration and project management features perfect for marketing teams");
        } else if (plan.planId === "PLAN-BASIC") {
          score += 15;
          reasons.push("Good for small marketing teams, Pro recommended for agencies");
        }
        break;
        
      case "media":
        if (plan.planId === "PLAN-PRO") {
          score += 25;
          reasons.push("Project-based work management ideal for media and creative teams");
        } else if (plan.planId === "PLAN-ENTERPRISE") {
          score += 15;
          reasons.push("Advanced features for large media organizations");
        }
        break;
        
      case "education":
        if (plan.planId === "PLAN-BASIC") {
          score += 20;
          reasons.push("Cost-effective solution perfect for educational institutions");
        } else if (plan.planId === "PLAN-PRO") {
          score += 25;
          reasons.push("Enhanced features for larger educational organizations");
        } else if (plan.planId === "PLAN-ENTERPRISE") {
          score += 15;
          reasons.push("Full feature set for large educational systems");
        }
        break;
        
      case "retail":
        if (plan.planId === "PLAN-BASIC") {
          score += 15;
          reasons.push("Good for small retail operations");
        } else if (plan.planId === "PLAN-PRO") {
          score += 25;
          reasons.push("Team management features ideal for retail chains");
        } else if (plan.planId === "PLAN-ENTERPRISE") {
          score += 20;
          reasons.push("Advanced features for large retail organizations");
        }
        break;
        
      case "non-profit":
        if (plan.planId === "PLAN-BASIC") {
          score += 25;
          reasons.push("Budget-friendly option perfect for non-profit organizations");
        } else if (plan.planId === "PLAN-PRO") {
          score += 20;
          reasons.push("Good features for larger non-profits with more complex needs");
        }
        break;
        
      case "other":
        // Neutral scoring for undefined industries
        if (plan.planId === "PLAN-PRO") {
          score += 15;
          reasons.push("Balanced feature set for diverse business needs");
        } else if (plan.planId === "PLAN-BASIC") {
          score += 10;
          reasons.push("Good starting point, can upgrade as needs grow");
        }
        break;
    }

    return { plan, score, reasons };
  });

  // Sort by score and return top recommendation
  planScores.sort((a, b) => b.score - a.score);
  return planScores[0];
};

function PlanSelectionStep({ context }: { context: any }) {
  const { toast } = useToast();
  const existingData = context.wizardData?.planSelection;
  
  const form = useForm<PlanSelectionData>({
    resolver: zodResolver(planSelectionSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: existingData?.skipped ? {
      type: "skipped",
      skipped: true,
      reason: existingData.reason || ""
    } : {
      type: "selected",
      selectedPlan: existingData?.selectedPlan || "",
      customizeFeatures: existingData?.customizeFeatures || false,
    },
  });

  // Real-time validation state
  const watchedValues = useWatch({ control: form.control });
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    errors: [],
    warnings: [],
    fieldStates: {}
  });
  const [isPlanValidating, setIsPlanValidating] = useState(false);

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ["/api/payments/plans"],
  });

  const organizationData = context.wizardData?.organization;
  const recommendation = getRecommendedPlan(organizationData, plans);

  // Real-time validation with async plan validation
  useEffect(() => {
    const validateAsync = async () => {
      const newState: ValidationState = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldStates: {}
      };

      if (watchedValues.type === "selected" && watchedValues.selectedPlan) {
        setIsPlanValidating(true);
        
        try {
          // Check plan availability
          const validation = await validatePlanAvailability(watchedValues.selectedPlan);
          
          if (!validation.isValid) {
            newState.fieldStates.selectedPlan = 'error';
            newState.errors.push(validation.message || "Selected plan is not available");
            newState.isValid = false;
          } else {
            newState.fieldStates.selectedPlan = 'success';
            
            // Check for plan-specific warnings
            const selectedPlan = plans.find(p => p.id === watchedValues.selectedPlan);
            const orgData = context.wizardData?.organization;
            
            if (selectedPlan && orgData) {
              // Warning for large companies choosing basic plan
              if ((orgData.companySize === '201-500' || orgData.companySize === '501-1000' || orgData.companySize === '1000+') && 
                  selectedPlan.name.toLowerCase() === 'basic') {
                newState.warnings.push('Basic plan may not provide sufficient features for larger organizations. Consider Pro or Enterprise for better scalability.');
              }
              
              // Warning for enterprise features on smaller plans
              if (orgData.primaryGoals?.includes('enterprise-management') && 
                  selectedPlan.name.toLowerCase() !== 'enterprise') {
                newState.warnings.push('For enterprise management features, consider upgrading to Enterprise plan.');
              }
            }
          }
        } catch (error) {
          newState.fieldStates.selectedPlan = 'error';
          newState.errors.push("Unable to validate plan availability. Please try again.");
          newState.isValid = false;
        } finally {
          setIsPlanValidating(false);
        }
      }

      setValidationState(newState);
    };

    if (watchedValues.type === "selected") {
      validateAsync();
    } else {
      // For skipped type, clear validation
      setValidationState({
        isValid: true,
        errors: [],
        warnings: [],
        fieldStates: {}
      });
    }
  }, [watchedValues, plans, context.wizardData]);

  const onSubmit = async (data: PlanSelectionData) => {
    if (data.type === "skipped") {
      toast({
        title: "Plan selection skipped",
        description: "You can choose a plan later from your dashboard.",
      });
      
      context.onComplete({
        skipped: true,
        reason: data.reason || "user_choice"
      });
      return;
    }
    
    if (data.type === "selected") {
      // Final validation before submission
      try {
        setIsPlanValidating(true);
        const validation = await validatePlanAvailability(data.selectedPlan);
        
        if (!validation.isValid) {
          toast({
            title: "Plan unavailable",
            description: validation.message || "The selected plan is currently unavailable. Please choose a different plan.",
            variant: "destructive",
          });
          return;
        }
        
        const selectedPlan = plans.find(plan => plan.id === data.selectedPlan);
        
        toast({
          title: "Perfect choice! 🎉",
          description: `${selectedPlan?.name} plan selected. Let's proceed to secure payment setup.`,
        });
        
        context.onComplete({
          selectedPlan: data.selectedPlan,
          customizeFeatures: data.customizeFeatures,
          planDetails: selectedPlan,
        });
      } catch (error) {
        toast({
          title: "Validation failed",
          description: "Unable to validate your plan selection. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsPlanValidating(false);
      }
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return <Star className="h-6 w-6 text-blue-500" />;
      case 'pro':
        return <Crown className="h-6 w-6 text-purple-500" />;
      case 'enterprise':
        return <Building className="h-6 w-6 text-orange-500" />;
      default:
        return <Zap className="h-6 w-6 text-green-500" />;
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return `₹${(amount / 100).toLocaleString('en-IN')}`;
  };

  if (plansLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="bg-blue-100 rounded-full p-3 mx-auto w-fit">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Loading your personalized recommendations...</h2>
        </div>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (plansError || plans.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-slate-900">Unable to load plans</h2>
          <p className="text-slate-600">Please try again or contact support</p>
          <Button onClick={context.onPrevious} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-purple-100 rounded-full p-3">
            <Brain className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Choose your perfect plan</h2>
        <p className="text-lg text-slate-600">
          Based on your company size and goals, we've found the best option for you
        </p>
      </div>

      {/* AI Recommendation */}
      {recommendation && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 mb-2">
                  🎯 AI Recommendation: {recommendation.plan.name} Plan
                </h3>
                <div className="space-y-1">
                  {recommendation.reasons.map((reason, index) => (
                    <p key={index} className="text-sm text-green-700">
                      • {reason}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Plan Selection */}
          <FormField
            control={form.control}
            name="selectedPlan"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {plans.map((plan) => {
                      const isRecommended = recommendation?.plan.id === plan.id;
                      const currentFormData = form.getValues();
                      const isSelected = currentFormData.type === "selected" && currentFormData.selectedPlan === plan.id;
                      
                      return (
                        <div
                          key={plan.id}
                          className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 shadow-lg' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          } ${
                            isRecommended ? 'ring-2 ring-green-400 ring-opacity-50' : ''
                          }`}
                          onClick={() => {
                            form.setValue("type", "selected");
                            form.setValue("selectedPlan", plan.id);
                            field.onChange(plan.id);
                          }}
                          data-testid={`plan-card-${plan.name.toLowerCase()}`}
                        >
                          {isRecommended && (
                            <Badge 
                              className="absolute -top-2 -right-2 bg-green-500 text-white"
                              data-testid="badge-recommended"
                            >
                              Recommended
                            </Badge>
                          )}
                          
                          {plan.name.toLowerCase() === 'pro' && !isRecommended && (
                            <Badge 
                              variant="destructive" 
                              className="absolute -top-2 -right-2"
                            >
                              Most Popular
                            </Badge>
                          )}

                          <div className="text-center space-y-4">
                            {getPlanIcon(plan.name)}
                            
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                              <p className="text-sm text-slate-600 mt-1">{plan.description}</p>
                            </div>

                            <div className="text-center">
                              <div className="text-3xl font-bold text-slate-900">
                                {formatPrice(plan.amount, plan.currency)}
                              </div>
                              <p className="text-sm text-slate-600">per month</p>
                            </div>

                            <div className="space-y-3 text-left">
                              {plan.features.map((feature, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-sm text-slate-600">{feature}</span>
                                </div>
                              ))}
                              
                              {plan.maxEmployees && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                  <span className="text-sm text-slate-600">
                                    Up to {plan.maxEmployees} employees
                                  </span>
                                </div>
                              )}
                              
                              {plan.maxWorkEntries && (
                                <div className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                  <span className="text-sm text-slate-600">
                                    Up to {plan.maxWorkEntries} work entries/month
                                  </span>
                                </div>
                              )}

                              {!plan.maxEmployees && plan.name === 'Enterprise' && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                  <span className="text-sm text-slate-600">Unlimited employees</span>
                                </div>
                              )}
                              
                              {!plan.maxWorkEntries && plan.name !== 'Basic' && (
                                <div className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                  <span className="text-sm text-slate-600">Unlimited work entries</span>
                                </div>
                              )}
                            </div>

                            {isSelected && (
                              <div className="flex items-center justify-center gap-2 text-blue-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">Selected</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Complete Later Option */}
          <Card className="border-blue-200 bg-blue-50/50 mt-8">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800">Not sure which plan to choose?</h4>
                    <p className="text-sm text-blue-700">
                      You can explore your dashboard first and choose a plan later that fits your needs.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Set form to skipped state and submit
                    form.setValue("type", "skipped");
                    form.setValue("skipped", true);
                    form.setValue("reason", "explore_first");
                    form.handleSubmit(onSubmit)();
                  }}
                  className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
                  data-testid="button-skip-plan-selection"
                >
                  Explore First
                </Button>
              </div>
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
              Continue to Payment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function PaymentStep({ context }: { context: any }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Get plan data from previous steps
  const planData = context.wizardData?.planSelection;
  const organizationData = context.wizardData?.organization;
  
  // Check if plan was skipped
  if (planData?.skipped) {
    return (
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full">
            <CreditCard className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Choose Your Plan First</h2>
          <p className="text-slate-600 mb-6">
            You skipped plan selection earlier. Please choose a subscription plan to activate your account and access all features.
          </p>
          
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                // Go back to plan selection step
                context.onStepChange("plan-selection");
              }}
              data-testid="button-back-to-plans"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Choose Plan
            </Button>
            <Button
              onClick={() => {
                // Skip payment and complete onboarding (trial mode)
                context.onComplete({ 
                  paymentSkipped: true, 
                  reason: "trial_mode",
                  trialAccount: true 
                });
              }}
              data-testid="button-continue-trial"
            >
              Continue with Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Payment step for selected plan
  const selectedPlan = planData?.planDetails;
  const planName = selectedPlan?.name || "Selected Plan";
  
  const handlePaymentSuccess = (paymentId: string) => {
    toast({
      title: "🎉 Welcome to Signedwork!",
      description: `Payment successful! Your ${planName} subscription is now active.`,
    });
    
    // Complete onboarding with payment success
    context.onComplete({
      paymentId,
      subscriptionActive: true,
      planId: selectedPlan?.id,
      planName: selectedPlan?.name
    });
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    toast({
      title: "Payment Failed",
      description: "There was an issue processing your payment. Please try again or contact support.",
      variant: "destructive",
    });
  };

  return (
    <div className="text-center space-y-4 md:space-y-6 max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-green-100 rounded-full">
          <CreditCard className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Complete Your Subscription</h2>
        <p className="text-sm md:text-base text-slate-600 px-2">
          You're almost done! Complete your payment to activate your {planName} subscription.
        </p>
      </div>

      {/* Plan Summary Card */}
      {selectedPlan && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="text-left flex-1">
                <h3 className="font-semibold text-slate-900 text-base md:text-lg">{selectedPlan.name} Plan</h3>
                <p className="text-sm text-slate-600">{selectedPlan.description}</p>
                <div className="text-xs md:text-sm text-slate-500 mt-1">
                  For {organizationData?.companyName || "your organization"}
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  ₹{(selectedPlan.amount / 100).toLocaleString()}
                </div>
                <div className="text-xs md:text-sm text-slate-500">
                  per {selectedPlan.interval || 'month'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Action */}
      <div className="space-y-4">
        <RazorpayCheckout
          planId={selectedPlan?.id || ""}
          planName={planName}
          amount={selectedPlan?.amount || 0}
          currency={selectedPlan?.currency || "INR"}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />

        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Shield className="w-4 h-4" />
          <span>Secure payment powered by Razorpay</span>
        </div>
        
        <div className="text-xs text-slate-400">
          By completing your purchase, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={context.onPrevious}
          className="w-full sm:w-auto h-11 order-2 sm:order-1"
          data-testid="button-previous-step"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            // Skip payment and continue with limited trial
            context.onComplete({ 
              paymentSkipped: true, 
              reason: "trial_requested",
              trialAccount: true 
            });
          }}
          className="w-full sm:w-auto h-11 order-1 sm:order-2 text-sm"
          data-testid="button-skip-payment"
        >
          Start Free Trial Instead
        </Button>
      </div>
    </div>
  );
}

export default function CompanyOnboarding() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
      isOptional: true,
      canSkip: true,
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

  // Load existing onboarding progress
  const { data: progressData, isLoading: isLoadingProgress, error: progressError } = useQuery({
    queryKey: ['/api/companies/onboarding/progress'],
    queryFn: () => apiRequest('GET', '/api/companies/onboarding/progress'),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Mutation for saving progress
  const saveProgressMutation = useMutation({
    mutationFn: async (progressData: { 
      currentStep: number; 
      completedSteps: number[]; 
      wizardData: Record<string, any>;
      isCompleted?: boolean;
    }) => {
      return apiRequest('POST', '/api/companies/onboarding/progress', progressData);
    },
    onSuccess: (response) => {
      // Update cache
      queryClient.setQueryData(['/api/companies/onboarding/progress'], response.progress);
      console.log('Progress saved successfully:', response);
    },
    onError: (error: any) => {
      console.error('Failed to save progress:', error);
      toast({
        title: "Failed to save progress",
        description: "Your progress couldn't be saved. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper functions for step ID/number mapping
  const stepIdToNumber = (stepId: string): number => {
    const index = wizardSteps.findIndex(step => step.id === stepId);
    return index >= 0 ? index + 1 : 1;
  };

  const stepNumberToId = (stepNumber: number): string => {
    const step = wizardSteps[stepNumber - 1];
    return step?.id || wizardSteps[0]?.id || "welcome";
  };

  // Initialize wizard with loaded progress or defaults
  const initialStepId = progressData?.currentStep ? 
    stepNumberToId(progressData.currentStep) : 
    "welcome";

  const initialCompletedSteps = progressData?.completedSteps ? 
    new Set(progressData.completedSteps.map((stepNumber: number) => stepNumberToId(stepNumber)).filter(Boolean)) :
    new Set<string>();

  const initialWizardData = progressData?.wizardData || {};

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
  } = useOnboardingWizard(wizardSteps, initialStepId, {
    initialCompletedSteps,
    initialWizardData
  });

  const handleStepComplete = (stepId: string, data: any) => {
    completeStep(stepId, data);
    
    // Calculate step numbers using helper functions
    const currentStepNumber = stepIdToNumber(currentStepId);
    const completedStepNumbers = Array.from(completedSteps).map(id => stepIdToNumber(id)).filter(num => num > 0);

    // Add current step to completed steps if not already included
    const stepBeingCompletedNumber = stepIdToNumber(stepId);
    if (!completedStepNumbers.includes(stepBeingCompletedNumber)) {
      completedStepNumbers.push(stepBeingCompletedNumber);
    }

    // Save progress to backend
    const progressData = {
      currentStep: currentStepNumber,
      completedSteps: completedStepNumbers.sort(),
      wizardData: { ...wizardData, [stepId]: data }
    };

    saveProgressMutation.mutate(progressData);
  };

  const handleWizardComplete = () => {
    console.log("Onboarding complete!", { wizardData });
    
    // Mark as completed and save final progress
    const completedStepIndices = wizardSteps.map((_, index) => index + 1);
    
    // Determine completion context based on wizard data
    const paymentData = wizardData?.payment;
    const planData = wizardData?.planSelection;
    
    const completionType = paymentData?.subscriptionActive ? 'paid' :
                          paymentData?.paymentSkipped || paymentData?.trialAccount ? 'trial' :
                          planData?.skipped ? 'freemium' : 'completed';
    
    const finalProgressData = {
      currentStep: wizardSteps.length,
      completedSteps: completedStepIndices,
      wizardData: {
        ...wizardData,
        completionMetadata: {
          completedAt: new Date().toISOString(),
          completionType,
          subscriptionActive: paymentData?.subscriptionActive || false,
          selectedPlan: planData?.planDetails?.name || null,
          trialAccount: paymentData?.trialAccount || false,
          organizationSetup: Boolean(wizardData?.organization),
          teamSetup: Boolean(wizardData?.teamSetup && !wizardData.teamSetup.setupLater),
          planSelected: Boolean(planData && !planData.skipped)
        }
      },
      isCompleted: true
    };

    saveProgressMutation.mutate(finalProgressData);

    // Show appropriate completion message based on completion type
    const completionMessages = {
      paid: {
        title: "🎉 Welcome to Signedwork Premium!",
        description: `Your ${planData?.planDetails?.name || 'Premium'} subscription is active. Let's get started!`,
      },
      trial: {
        title: "🚀 Welcome to Signedwork!",
        description: "You're on a free trial. Upgrade anytime to unlock all features.",
      },
      freemium: {
        title: "✨ Welcome to Signedwork!",
        description: "Your account is set up! You can choose a plan later from your dashboard.",
      },
      completed: {
        title: "🎉 Onboarding Complete!",
        description: "Welcome to Signedwork! Your account is now fully set up.",
      }
    };

    const message = completionMessages[completionType] || completionMessages.completed;
    
    toast({
      title: message.title,
      description: message.description,
    });

    // Redirect to appropriate dashboard section based on completion context
    const redirectPath = completionType === 'trial' || completionType === 'freemium' 
      ? "/company-dashboard?welcome=true&upgrade=true"
      : "/company-dashboard?welcome=true";

    setTimeout(() => {
      setLocation(redirectPath);
    }, 2000);
  };

  const handleSaveProgress = (data: any) => {
    // This function is called by OnboardingWizard for auto-saving
    // Convert step IDs to numbers for backend storage using helper functions
    const currentStepNumber = stepIdToNumber(data.currentStepId);
    const completedStepNumbers = data.completedSteps.map((stepId: string) => stepIdToNumber(stepId)).filter((num: number) => num > 0);

    const progressData = {
      currentStep: currentStepNumber,
      completedSteps: completedStepNumbers,
      wizardData: data.wizardData
    };

    saveProgressMutation.mutate(progressData);
  };

  // Show loading state while fetching progress
  if (isLoadingProgress) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-600">Loading your onboarding progress...</p>
        </div>
      </div>
    );
  }

  // Show error state if progress loading failed
  if (progressError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Failed to Load Progress</h2>
          <p className="text-slate-600">We couldn't load your onboarding progress. Please refresh the page to try again.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

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