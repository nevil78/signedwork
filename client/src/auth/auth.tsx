import { useState, useEffect, memo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Shield, User, Building, ArrowLeft, Check, Eye, EyeOff, AlertCircle, ShieldCheck, Mail, CheckCircle } from "lucide-react";
import signedworkLogo from "@assets/Signed-work-Logo (1)_1755168042120.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertEmployeeSchema, insertCompanySchema, clientSignupSchema, loginSchema, type InsertEmployee, type InsertCompany, type ClientSignupData, type LoginData } from "@shared/schema";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { PrefetchLink } from "@/components/PrefetchLink";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import TermsOfServiceModal from "@/components/TermsOfServiceModal";
import UnifiedHeader from "@/components/UnifiedHeader";

type AuthView = "selection" | "employee" | "company" | "client" | "login" | "success" | "otp-verification" | "verification-pending" | "registration-success" | "employee-register" | "company-register" | "client-register" | "company-login";

interface PasswordRequirement {
  id: string;
  label: string;
  regex?: RegExp;
  minLength?: number;
}

const passwordRequirements: PasswordRequirement[] = [
  { id: "length", label: "At least 8 characters", minLength: 8 },
  { id: "uppercase", label: "One uppercase letter", regex: /[A-Z]/ },
  { id: "number", label: "One number", regex: /\d/ },
];

const PasswordStrengthIndicator = memo(({ password }: { password: string }) => {
  return (
    <div className="mt-2 space-y-1">
      {passwordRequirements.map((req) => {
        let isValid = false;
        if (req.minLength) {
          isValid = password.length >= req.minLength;
        } else if (req.regex) {
          isValid = req.regex.test(password);
        }
        
        return (
          <div key={req.id} className={`flex items-center text-xs ${isValid ? 'text-green-600' : 'text-slate-400'}`}>
            <Check className={`w-3 h-3 mr-2 ${isValid ? 'text-green-600' : 'text-slate-400'}`} />
            {req.label}
          </div>
        );
      })}
    </div>
  );
});

PasswordStrengthIndicator.displayName = "PasswordStrengthIndicator";

const PasswordInput = memo(({ field, placeholder, className = "" }: { field: any; placeholder: string; className?: string }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);
  
  return (
    <div className="relative">
      <Input
        {...field}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className={`pr-12 ${className}`}
        maxLength={12}
        data-testid="input-password"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
        onClick={togglePassword}
      >
        {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
      </Button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

export default function AuthPage() {
  // Check URL parameters for initial view using wouter
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const viewParam = urlParams.get('view') as AuthView | null;
  
  const [currentView, setCurrentView] = useState<AuthView>(viewParam || "selection");
  const [loginError, setLoginError] = useState<boolean>(false);
  const [verificationEmail, setVerificationEmail] = useState<string>("");
  const [otp, setOTP] = useState("");
  const [countdown, setCountdown] = useState(60); // 1 minute
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [companyTermsAccepted, setCompanyTermsAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasUserStartedFilling, setHasUserStartedFilling] = useState(false);

  // Initialize with empty field errors
  useEffect(() => {
    setFieldErrors({});
  }, []);
  const { toast } = useToast();

  // Handle URL view parameters dynamically
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const currentViewParam = urlParams.get('view') as AuthView | null;
    
    console.log('Auth page URL params:', location);
    console.log('View parameter:', currentViewParam);
    
    if (currentViewParam) {
      // Map legacy view names to current view names
      if (currentViewParam === 'employee-register') {
        setCurrentView('employee');
      } else if (currentViewParam === 'company-register') {
        setCurrentView('company');
      } else if (currentViewParam as AuthView) {
        console.log('Setting current view to:', currentViewParam);
        setCurrentView(currentViewParam as AuthView);
      }
    }
  }, [location]);

  // Handle OAuth error redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const error = urlParams.get('error');
    
    if (error) {
      let errorMessage = "Authentication failed";
      let errorTitle = "Sign-in Error";
      
      switch (error) {
        case 'google_auth_failed':
          errorMessage = "Google authentication was cancelled or failed. Please try again.";
          errorTitle = "Google Sign-in Cancelled";
          break;
        case 'no_user_data':
          errorMessage = "Unable to retrieve user information from Google. Please try again.";
          break;
        case 'no_employee_data':
          errorMessage = "Failed to create employee account. Please try again.";
          break;
        case 'auth_failed':
          errorMessage = "Authentication process failed. Please try again.";
          break;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      
      // Clean up URL without refreshing page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // OTP countdown effect
  useEffect(() => {
    if (currentView === "otp-verification" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentView, countdown]);

  const employeeForm = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryCode: "+1",
      password: "",
    },
  });

  // Helper function to check if field has error and should show red border
  const getFieldErrorClass = (fieldName: string, fieldState: any) => {
    // Show red border for:
    // 1. Custom field errors (for empty required fields)
    // 2. Form submission errors (after user tries to submit)
    const hasCustomError = fieldErrors[fieldName];
    const hasSubmissionError = fieldState?.error && companyForm.formState.isSubmitted;
    
    if (hasCustomError || hasSubmissionError) {
      return "field-error";
    }
    return "";
  };

  // Handle field blur validation
  const handleFieldBlur = (fieldName: string) => {
    const value = employeeForm.getValues(fieldName as any);
    if (!value || value.toString().trim() === "") {
      setFieldErrors(prev => ({ ...prev, [fieldName]: true }));
      // Trigger form validation
      employeeForm.trigger(fieldName as any);
    } else {
      setFieldErrors(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const companyForm = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
    mode: "onSubmit", // Only validate on submit, not on every change
    defaultValues: {
      name: "",
      industry: "",
      size: "",
      establishmentYear: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      registrationNumber: "",
      cin: "",
      panNumber: "",
      email: "",
      password: "",
    },
  });

  // Simple client signup schema without confirmPassword for streamlined UX
  const simpleClientSignupSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number"),
    location: z.string().min(1, "Please select your country"),
  });

  type SimpleClientSignupData = z.infer<typeof simpleClientSignupSchema>;

  const clientForm = useForm<SimpleClientSignupData>({
    resolver: zodResolver(simpleClientSignupSchema),
    mode: "onSubmit",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      location: "",
    },
  });

  // Get account type from URL parameter
  const getDefaultAccountType = () => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const accountTypeParam = urlParams.get('accountType');
    if (accountTypeParam === "company") return "company";
    if (accountTypeParam === "client") return "client";
    return "employee";
  };

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      accountType: getDefaultAccountType(),
    },
  });

  // Validate required fields and show red borders for empty ones
  const validateRequiredFields = () => {
    if (currentView !== "company" || !hasUserStartedFilling) return;
    
    const { name, email, password } = companyForm.getValues();
    const errors: Record<string, boolean> = {};
    
    // Only check the 3 essential fields for simplified form
    const isEmpty = (value: string | undefined | null) => !value || value.trim() === "";
    
    if (isEmpty(name)) errors.name = true;
    if (isEmpty(email)) errors.email = true;
    if (isEmpty(password)) errors.password = true;
    
    // Check terms acceptance
    if (!companyTermsAccepted) {
      errors.companyTerms = true;
    }
    
    setFieldErrors(errors);
  };

  // Watch form values and validate in real-time for company form only
  useEffect(() => {
    if (currentView === "company" && hasUserStartedFilling) {
      const subscription = companyForm.watch((values, { name, type }) => {
        // Immediate validation when any field changes
        setTimeout(() => validateRequiredFields(), 0);
      });
      return () => subscription.unsubscribe();
    }
  }, [currentView, companyForm, hasUserStartedFilling]);

  // Reset employee form on page load/view change to employee view
  useEffect(() => {
    if (currentView === "employee") {
      employeeForm.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        countryCode: "+1",
        password: "",
      });
      setFieldErrors({});
    }
  }, [currentView, employeeForm]);

  // Reset company form on page load/view change to company view
  useEffect(() => {
    if (currentView === "company") {
      // Clear errors first
      setFieldErrors({});
      companyForm.clearErrors();
      setHasUserStartedFilling(false); // Reset interaction flag
      
      // Complete form reset with all fields
      companyForm.reset({
        name: "",
        industry: "",
        size: "",
        establishmentYear: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        registrationNumber: "",
        cin: "",
        panNumber: "",
        email: "",
        password: "",
      }, {
        keepErrors: false,
        keepDirty: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      });
    }
  }, [currentView, companyForm]);

  // Reset login form and clear errors when switching to login view
  useEffect(() => {
    if (currentView === "login") {
      loginForm.reset({
        email: "",
        password: "",
        accountType: "employee",
      });
      setLoginError(false); // Clear login error state
      setFieldErrors({});
    }
  }, [currentView, loginForm]);

  const employeeRegistration = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      return await apiRequest("POST", "/api/auth/signup/employee", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phone,
        password: data.password
      });
    },
    onSuccess: (response: any) => {
      setVerificationEmail(employeeForm.getValues("email"));
      setCurrentView("otp-verification");
      toast({
        title: "OTP Sent!",
        description: response.message || "Please check your email for the verification code.",
      });
    },
    onError: (error: any) => {
      const isEmailAlreadyRegistered = error.message && error.message.includes("Email already registered");
      toast({
        title: isEmailAlreadyRegistered ? "Email Already Registered" : "Registration Failed",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  const verifyOTP = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      return await apiRequest("POST", "/api/auth/verify-employee-otp", {
        email,
        otp
      });
    },
    onSuccess: (response: any) => {
      // Invalidate auth queries to refresh authentication state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session-status"] });
      
      toast({
        title: "Account Created!",
        description: response.message || "Your account has been created successfully. Redirecting to dashboard...",
      });
      
      // Direct redirect to employee dashboard after successful signup
      setTimeout(() => {
        setLocation("/summary");
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired OTP code",
        variant: "destructive",
      });
    },
  });

  const companyRegistration = useMutation({
    mutationFn: async (data: InsertCompany) => {
      return await apiRequest("POST", "/api/auth/signup/company", {
        name: data.name,
        email: data.email,
        password: data.password
        // All other fields will be collected later in the onboarding wizard
      });
    },
    onSuccess: (response: any) => {
      // Invalidate auth queries to refresh authentication state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session-status"] });
      
      toast({
        title: "Account Created Successfully!",
        description: response.message || "Your company account has been created successfully!",
      });
      
      // Since user is now automatically logged in, redirect directly to dashboard
      setTimeout(() => {
        if (response.authenticated && response.userType === "company") {
          setLocation("/company-dashboard");
        } else {
          // Fallback to login view if something went wrong
          setCurrentView("company-login");
        }
      }, 1500);
    },
    onError: (error: any) => {
      const isEmailAlreadyRegistered = error.message && error.message.includes("Email already registered");
      toast({
        title: isEmailAlreadyRegistered ? "Email Already Registered" : "Registration Failed", 
        description: error.message || "Failed to initiate signup",
        variant: "destructive",
      });
    },
  });

  const clientRegistration = useMutation({
    mutationFn: async (data: ClientSignupData) => {
      return await apiRequest("POST", "/api/auth/register/client", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        location: data.location, // This is now the country
      });
    },
    onSuccess: (response: any) => {
      // Invalidate auth queries to refresh authentication state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session-status"] });
      
      toast({
        title: "Account Created Successfully!",
        description: response.message || "Your client account has been created. You can start posting projects!",
      });
      
      // Direct redirect to client dashboard
      setTimeout(() => {
        setLocation("/client/dashboard");
      }, 1500);
    },
    onError: (error: any) => {
      const isEmailAlreadyRegistered = error.message && error.message.includes("Email already registered");
      toast({
        title: isEmailAlreadyRegistered ? "Email Already Registered" : "Registration Failed", 
        description: error.message || "Failed to create client account",
        variant: "destructive",
      });
    },
  });

  const login = useMutation({
    mutationFn: async (data: LoginData) => {
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: (response: any) => {
      console.log("Login successful, response:", response);
      // Redirect based on user type
      if (response.userType === "employee") {
        console.log("Redirecting to employee summary dashboard");
        setLocation("/summary");
      } else if (response.userType === "client") {
        console.log("Redirecting to client dashboard");
        setLocation("/client/dashboard");
      } else {
        console.log("Redirecting to company dashboard");
        setLocation("/company-dashboard");
      }
    },
    onError: (error: any) => {
      // Check for email verification requirement
      const requiresEmailVerification = error.message?.includes("Email verification required") || 
                                       error.status === 403;
      
      // Check for authentication errors
      const isAuthError = error.message?.includes("Invalid email or password") || 
                         error.message?.includes("401") ||
                         error.status === 401;
      
      if (requiresEmailVerification) {
        toast({
          title: "Email Verification Required",
          description: "Please verify your email address before logging in. Check your email for verification instructions.",
          variant: "destructive",
        });
        return;
      }
      
      // Set login error state to trigger visual feedback
      setLoginError(true);
      
      // Set form errors on the email and password fields
      loginForm.setError("email", { 
        type: "manual", 
        message: "" 
      });
      loginForm.setError("password", { 
        type: "manual", 
        message: "" 
      });
      
      toast({
        title: "Login Failed",
        description: isAuthError ? "Invalid ID or password" : "Please check your credentials and try again",
        variant: "destructive",
      });
    },
  });

  // Function to validate all required fields and show errors immediately
  const validateEmployeeForm = () => {
    const data = employeeForm.getValues();
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'password'];
    let hasEmptyFields = false;
    const newErrors: Record<string, boolean> = {};
    
    requiredFields.forEach(field => {
      const value = data[field as keyof InsertEmployee];
      if (!value || value.toString().trim() === "") {
        newErrors[field] = true;
        hasEmptyFields = true;
      } else {
        newErrors[field] = false;
      }
    });
    
    // Check terms checkbox
    const termsCheckbox = document.getElementById('terms') as HTMLInputElement;
    if (!termsCheckbox?.checked) {
      newErrors.terms = true;
      hasEmptyFields = true;
    } else {
      newErrors.terms = false;
    }
    
    setFieldErrors(prev => ({ ...prev, ...newErrors }));
    return !hasEmptyFields;
  };

  const onEmployeeSubmit = (data: InsertEmployee) => {
    if (!validateEmployeeForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and accept the terms",
        variant: "destructive",
      });
      return;
    }
    
    employeeRegistration.mutate(data);
  };

  // Function to validate all required company fields and show errors immediately
  const validateCompanyForm = () => {
    const data = companyForm.getValues();
    
    // Only require the 3 essential fields for simplified registration
    const requiredFields = ['name', 'email', 'password'];
    const newErrors: Record<string, boolean> = {};
    
    const isEmpty = (v?: string | null) => !v || v.trim() === "";
    
    requiredFields.forEach(field => {
      const value = data[field as keyof InsertCompany];
      if (isEmpty(value as string)) {
        newErrors[field] = true;
      } else {
        newErrors[field] = false;
      }
    });
    
    // Check company terms checkbox
    newErrors.companyTerms = !companyTermsAccepted;
    
    setFieldErrors(prev => ({ ...prev, ...newErrors }));
    return !Object.values(newErrors).some(Boolean);
  };

  const onCompanySubmit = (data: InsertCompany) => {
    if (!validateCompanyForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and accept the terms",
        variant: "destructive",
      });
      return;
    }
    
    companyRegistration.mutate(data);
  };

  const onClientSubmit = (data: SimpleClientSignupData) => {
    console.log("Client form submitted with data:", data);
    
    // Basic validation check
    if (!data.firstName || !data.lastName || !data.email || !data.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Calling clientRegistration.mutate");
    clientRegistration.mutate(data as any); // Convert to expected API format
  };

  const onLoginSubmit = (data: LoginData) => {
    // Clear previous login errors when attempting new login
    setLoginError(false);
    loginForm.clearErrors();
    login.mutate(data);
  };

  if (currentView === "selection") {
    return (
      <div className="min-h-screen bg-slate-50">
        <UnifiedHeader 
          showAuthButtons={false}
          currentPage="auth"
        />

        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome</h1>
              <p className="text-slate-600">Choose your account type to get started</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <Card 
                className="cursor-pointer border-2 border-transparent hover:border-primary transition-all duration-300 group"
                onClick={() => setCurrentView("employee")}
                data-testid="button-select-employee"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <User className="text-primary text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Employee</h3>
                  <p className="text-sm text-slate-600">Individual professional account</p>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer border-2 border-transparent hover:border-primary transition-all duration-300 group"
                onClick={() => setCurrentView("company")}
                data-testid="button-select-company"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Building className="text-primary text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Company</h3>
                  <p className="text-sm text-slate-600">Organization account</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer border-2 border-transparent hover:border-primary transition-all duration-300 group"
                onClick={() => setCurrentView("client")}
                data-testid="button-select-client"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                    <Shield className="text-purple-600 text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Client</h3>
                  <p className="text-sm text-slate-600">Hire freelancers for projects</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary hover:text-primary-dark font-medium"
                  onClick={() => setCurrentView("login")}
                >
                  Sign in
                </Button>
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === "employee") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
                <span className="text-xl font-bold text-slate-800">Signedwork</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Card className="rounded-2xl shadow-xl min-h-[600px]">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-slate-600 mr-3"
                    onClick={() => setCurrentView("selection")}
                  >
                    <ArrowLeft className="text-lg" />
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Employee Registration</h2>
                    <p className="text-sm text-slate-600">Create your professional account</p>
                  </div>
                </div>
                
                <Form {...employeeForm}>
                  <form onSubmit={employeeForm.handleSubmit(onEmployeeSubmit)} className="space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={employeeForm.control}
                        name="firstName"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="First name" 
                                {...field}
                                className={getFieldErrorClass("firstName", fieldState)}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Clear error on change
                                  if (e.target.value.trim()) {
                                    setFieldErrors(prev => ({ ...prev, firstName: false }));
                                  }
                                }}
                                onBlur={() => handleFieldBlur("firstName")}
                                data-testid="input-first-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={employeeForm.control}
                        name="lastName"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Last name" 
                                {...field}
                                className={getFieldErrorClass("lastName", fieldState)}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Clear error on change
                                  if (e.target.value.trim()) {
                                    setFieldErrors(prev => ({ ...prev, lastName: false }));
                                  }
                                }}
                                onBlur={() => handleFieldBlur("lastName")}
                                data-testid="input-last-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={employeeForm.control}
                      name="email"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Work Email *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="your@email.com" 
                              {...field}
                              className={getFieldErrorClass("email", fieldState)}
                              onChange={(e) => {
                                field.onChange(e);
                                // Clear error on change
                                if (e.target.value.trim()) {
                                  setFieldErrors(prev => ({ ...prev, email: false }));
                                }
                              }}
                              onBlur={() => handleFieldBlur("email")}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={employeeForm.control}
                      name="phone"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="1234567890" 
                              {...field}
                              className={getFieldErrorClass("phone", fieldState)}
                              onChange={(e) => {
                                field.onChange(e);
                                // Clear error on change
                                if (e.target.value.trim()) {
                                  setFieldErrors(prev => ({ ...prev, phone: false }));
                                }
                              }}
                              onBlur={() => handleFieldBlur("phone")}
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={employeeForm.control}
                      name="password"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <PasswordInput 
                              field={{
                                ...field,
                                onChange: (e: any) => {
                                  field.onChange(e);
                                  // Clear error on change
                                  if (e.target.value.trim()) {
                                    setFieldErrors(prev => ({ ...prev, password: false }));
                                  }
                                },
                                onBlur: () => handleFieldBlur("password")
                              }} 
                              placeholder="••••••••" 
                              className={getFieldErrorClass("password", fieldState)}
                            />
                          </FormControl>
                          <PasswordStrengthIndicator password={field.value || ""} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="terms" 
                        required 
                        className={fieldErrors.terms ? "field-error" : ""}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFieldErrors(prev => ({ ...prev, terms: false }));
                          }
                        }}
                        data-testid="checkbox-terms"
                      />
                      <label htmlFor="terms" className="text-sm text-slate-600">
                        I agree to the{" "}
                        <button 
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-primary hover:text-primary-dark underline"
                        >
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button 
                          type="button"
                          onClick={() => setShowPrivacyModal(true)}
                          className="text-primary hover:text-primary-dark underline"
                        >
                          Privacy Policy
                        </button>
                      </label>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={employeeRegistration.isPending}
                      onClick={(e) => {
                        // Validate immediately when button is clicked to show red borders
                        validateEmployeeForm();
                      }}
                      data-testid="button-create-employee-account"
                    >
                      {employeeRegistration.isPending ? "Creating Account..." : "Create Employee Account"}
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-500">Or</span>
                      </div>
                    </div>

                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => window.location.href = `/api/auth/google?t=${Date.now()}`}
                      data-testid="button-google-signup"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </Button>
                    
                    <div className="text-center text-sm text-slate-600">
                      Already have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary hover:text-primary-dark font-medium"
                        onClick={() => setCurrentView("login")}
                      >
                        Sign in
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>
        
        {/* Legal Modals */}
        <PrivacyPolicyModal 
          isOpen={showPrivacyModal} 
          onClose={() => setShowPrivacyModal(false)} 
        />
        <TermsOfServiceModal 
          isOpen={showTermsModal} 
          onClose={() => setShowTermsModal(false)} 
        />
      </div>
    );
  }

  if (currentView === "company") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
                <span className="text-xl font-bold text-slate-800">Signedwork</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Card className="rounded-2xl shadow-xl min-h-[600px]">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-slate-600 mr-3"
                    onClick={() => setCurrentView("selection")}
                  >
                    <ArrowLeft className="text-lg" />
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Company Registration</h2>
                    <p className="text-sm text-slate-600">Register your organization</p>
                  </div>
                </div>
                
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-6">
                    {/* Simplified Company Registration - Following Hubstaff's Approach */}
                    <p className="text-sm text-slate-600 mb-6">
                      Get started with just the basics. You can add more details later in your company setup wizard.
                    </p>
                    
                    <FormField
                      control={companyForm.control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Acme Corporation" 
                              {...field}
                              className={getFieldErrorClass("name", fieldState)}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!hasUserStartedFilling) {
                                  setHasUserStartedFilling(true);
                                }
                                setTimeout(() => validateRequiredFields(), 0);
                              }}
                              data-testid="input-company-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Work Email *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="admin@acme.com" 
                              {...field}
                              className={getFieldErrorClass("email", fieldState)}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!hasUserStartedFilling) {
                                  setHasUserStartedFilling(true);
                                }
                                if (e.target.value.trim()) {
                                  setFieldErrors(prev => ({ ...prev, email: false }));
                                  companyForm.clearErrors("email");
                                }
                              }}
                              onBlur={() => handleFieldBlur("email")}
                              data-testid="input-company-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="password"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <PasswordInput 
                              field={{
                                ...field,
                                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                  field.onChange(e);
                                  if (e.target.value.trim()) {
                                    setFieldErrors(prev => ({ ...prev, password: false }));
                                    companyForm.clearErrors("password");
                                  }
                                },
                                onBlur: () => handleFieldBlur("password")
                              }} 
                              placeholder="••••••••" 
                              className={getFieldErrorClass("password", fieldState)}
                            />
                          </FormControl>
                          <PasswordStrengthIndicator password={field.value || ""} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="company-terms" 
                        required 
                        checked={companyTermsAccepted}
                        className={fieldErrors.companyTerms ? "field-error" : ""}
                        onCheckedChange={(checked) => {
                          setCompanyTermsAccepted(checked === true);
                          if (checked) {
                            setFieldErrors(prev => ({ ...prev, companyTerms: false }));
                          }
                        }}
                        data-testid="checkbox-company-terms"
                      />
                      <label htmlFor="company-terms" className="text-sm text-slate-600">
                        I agree to the{" "}
                        <button 
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-primary hover:text-primary-dark underline"
                        >
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button 
                          type="button"
                          onClick={() => setShowPrivacyModal(true)}
                          className="text-primary hover:text-primary-dark underline"
                        >
                          Privacy Policy
                        </button>
                      </label>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full py-3" 
                      disabled={companyRegistration.isPending}
                      data-testid="button-create-company-account"
                    >
                      {companyRegistration.isPending ? "Creating Account..." : "Create Company Account"}
                    </Button>
                    
                    <div className="text-center text-sm text-slate-600">
                      Already have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary hover:text-primary-dark font-medium"
                        onClick={() => setCurrentView("login")}
                      >
                        Sign in
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>
        
        {/* Legal Modals */}
        <PrivacyPolicyModal 
          isOpen={showPrivacyModal} 
          onClose={() => setShowPrivacyModal(false)} 
        />
        <TermsOfServiceModal 
          isOpen={showTermsModal} 
          onClose={() => setShowTermsModal(false)} 
        />
      </div>
    );
  }

  if (currentView === "client") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
                <span className="text-xl font-bold text-slate-800">Signedwork</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Card className="rounded-2xl shadow-xl min-h-[600px]">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-slate-600 mr-3"
                    onClick={() => setCurrentView("selection")}
                  >
                    <ArrowLeft className="text-lg" />
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Join as a Client</h2>
                    <p className="text-sm text-slate-600">Create your client account to hire freelancers</p>
                  </div>
                </div>
                
                <Form {...clientForm}>
                  <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-6">
                    
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={clientForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="First name" {...field} data-testid="input-client-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={clientForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Last name" {...field} data-testid="input-client-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Work Email */}
                    <FormField
                      control={clientForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work email address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="name@company.com" {...field} data-testid="input-client-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Password */}
                    <FormField
                      control={clientForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput field={field} placeholder="Password (8 or more characters)" />
                          </FormControl>
                          <PasswordStrengthIndicator password={field.value || ""} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Country */}
                    <FormField
                      control={clientForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <SelectTrigger data-testid="select-client-country">
                                <SelectValue placeholder="Select your country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="United States">United States</SelectItem>
                                <SelectItem value="Canada">Canada</SelectItem>
                                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                <SelectItem value="Australia">Australia</SelectItem>
                                <SelectItem value="Germany">Germany</SelectItem>
                                <SelectItem value="France">France</SelectItem>
                                <SelectItem value="India">India</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Optional email tips checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox id="email-tips" />
                      <label htmlFor="email-tips" className="text-sm text-slate-600">
                        Send me emails with tips on how to find talent that fits my needs
                      </label>
                    </div>

                    {/* Terms Agreement */}
                    <div className="flex items-start space-x-2">
                      <Checkbox id="client-terms" required />
                      <label htmlFor="client-terms" className="text-sm text-slate-600 leading-relaxed">
                        Yes, I understand and agree to the Signedwork Terms of Service, including the User Agreement and Privacy Policy
                      </label>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full py-3" 
                      disabled={clientRegistration.isPending}
                      data-testid="button-create-client-account"
                    >
                      {clientRegistration.isPending ? "Creating Account..." : "Create Client Account"}
                    </Button>
                    
                    <div className="text-center text-sm text-slate-600">
                      Already have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary hover:text-primary-dark font-medium"
                        onClick={() => setCurrentView("login")}
                      >
                        Sign in
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>
        
        {/* Legal Modals */}
        <PrivacyPolicyModal 
          isOpen={showPrivacyModal} 
          onClose={() => setShowPrivacyModal(false)} 
        />
        <TermsOfServiceModal 
          isOpen={showTermsModal} 
          onClose={() => setShowTermsModal(false)} 
        />
      </div>
    );
  }

  if (currentView === "login") {
    return (
      <div className="min-h-screen bg-slate-50">
        <UnifiedHeader 
          showAuthButtons={false}
          currentPage="auth"
        />

        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto space-y-6">
            
            {/* Header - Outside the box */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
              <p className="text-sm text-slate-600 mt-2">Welcome back! Please sign in to your account</p>
            </div>
            
            {/* Error Messages - Outside the box, displayed above */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 text-sm font-medium">
                  Invalid credentials. Please check your email and password.
                </p>
              </div>
            )}
            
            {/* Main Sign In Box - Fixed size container with minimum height */}
            <Card className="rounded-2xl shadow-xl min-h-[400px]">
              <CardContent className="p-8">
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    
                    {/* Account Type - Inside the box */}
                    <FormField
                      control={loginForm.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                            >
                              <label className="flex items-center justify-center p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-blue-50" htmlFor="employee">
                                <RadioGroupItem value="employee" id="employee" className="sr-only" />
                                <User className="text-primary mr-2" />
                                <span className="text-sm font-medium">Employee</span>
                              </label>
                              <label className="flex items-center justify-center p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-blue-50" htmlFor="company">
                                <RadioGroupItem value="company" id="company" className="sr-only" />
                                <Building className="text-primary mr-2" />
                                <span className="text-sm font-medium">Company</span>
                              </label>
                              <label className="flex items-center justify-center p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-blue-50" htmlFor="client">
                                <RadioGroupItem value="client" id="client" className="sr-only" />
                                <Shield className="text-purple-600 mr-2" />
                                <span className="text-sm font-medium">Client</span>
                              </label>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Email - Inside the box */}
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="your@email.com" 
                              {...field}
                              className={getFieldErrorClass("email", fieldState)}
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value.trim()) {
                                  setLoginError(false);
                                }
                              }}
                              data-testid="login-email-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Password - Inside the box */}
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput 
                              field={field} 
                              placeholder="••••••••"
                              className={getFieldErrorClass("password", fieldState)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Remember me & Forgot password - Inside the box */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <label htmlFor="remember" className="text-sm text-slate-600">Remember me</label>
                      </div>
                      <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark">
                        Forgot password?
                      </Link>
                    </div>
                    
                    {/* Sign In Button - Inside the box */}
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={login.isPending}
                      data-testid="button-sign-in"
                    >
                      {login.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                    
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Fixed height container - same space for both account types */}
            <div className="space-y-4">
              {loginForm.watch("accountType") === "employee" ? (
                <>
                  {/* Employee: OR separator */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-50 px-2 text-slate-500">Or</span>
                    </div>
                  </div>

                  {/* Employee: Google Sign In Button */}
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = `/api/auth/google?t=${Date.now()}`}
                    data-testid="button-google-signin"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </Button>

                  {/* Employee: Sign Up Link below Google button */}
                  <div className="text-center text-sm text-slate-600">
                    Don't have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary hover:text-primary-dark font-medium"
                      onClick={() => setCurrentView("selection")}
                      data-testid="link-sign-up"
                    >
                      Sign up
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Company: Sign Up Link in place of OR */}
                  <div className="text-center text-sm text-slate-600">
                    Don't have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary hover:text-primary-dark font-medium"
                      onClick={() => setCurrentView("selection")}
                      data-testid="link-sign-up"
                    >
                      Sign up
                    </Button>
                  </div>
                  
                  {/* Company: Empty spacer to match Google button + Sign Up link height */}
                  <div className="h-[68px]"></div>
                </>
              )}
            </div>
            
          </div>
        </main>
      </div>
    );
  }

  if (currentView === "success") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
                <span className="text-xl font-bold text-slate-800">Signedwork</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <Card className="rounded-2xl shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="text-green-600 text-2xl" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
                <p className="text-slate-600 mb-6">Your account has been created successfully. You can now sign in to access your dashboard.</p>
                <Button onClick={() => setCurrentView("login")}>
                  Continue to Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === "otp-verification") {

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVerifyOTP = () => {
      if (otp.length === 6) {
        verifyOTP.mutate({ email: verificationEmail, otp });
      }
    };

    const handleResendOTP = () => {
      // Resend OTP by calling the signup endpoint again
      const formData = employeeForm.getValues();
      employeeRegistration.mutate(formData);
      setCountdown(60);
      setOTP(""); // Clear current OTP
    };

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
                <span className="text-xl font-bold text-slate-800">Signedwork</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <Card className="rounded-2xl shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="text-blue-600 text-2xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h2>
                  <p className="text-slate-600 mb-4">
                    Enter the 6-digit code sent to
                  </p>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <span className="font-medium text-slate-800 bg-slate-100 px-3 py-1 rounded-md">
                      {verificationEmail}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Allow user to edit email without going back
                        const newEmail = prompt("Enter new email address:", verificationEmail);
                        if (newEmail && newEmail !== verificationEmail) {
                          setVerificationEmail(newEmail);
                          employeeForm.setValue("email", newEmail);
                          toast({
                            title: "Email Updated",
                            description: "Email address updated. Please request a new verification code.",
                          });
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700 p-1"
                      data-testid="edit-email-btn"
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    <div className="flex items-center justify-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Code expires in {formatTime(countdown)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-2">
                      Verification Code
                    </label>
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="text-center text-lg tracking-widest font-mono"
                      maxLength={6}
                      data-testid="input-otp"
                    />
                  </div>

                  <Button
                    onClick={handleVerifyOTP}
                    disabled={otp.length !== 6 || verifyOTP.isPending}
                    className="w-full"
                    data-testid="button-verify-otp"
                  >
                    {verifyOTP.isPending ? "Verifying..." : "Verify & Create Account"}
                  </Button>

                  <div className="text-center space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">
                        Didn't receive the code?
                      </p>
                      {countdown > 0 ? (
                        <p className="text-sm text-slate-500">
                          Resend available in {formatTime(countdown)}
                        </p>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResendOTP}
                          disabled={employeeRegistration.isPending}
                          className="text-sm"
                          data-testid="button-resend-otp"
                        >
                          {employeeRegistration.isPending ? "Sending..." : "Resend Code"}
                        </Button>
                      )}
                    </div>
                    
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <p className="text-sm text-slate-600">
                        Need to change your details?
                      </p>
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentView("employee")}
                          className="text-sm text-blue-600 hover:text-blue-700"
                          data-testid="back-edit-details-btn"
                        >
                          Edit Registration Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentView("selection")}
                          className="text-sm text-slate-600 hover:text-slate-800"
                          data-testid="back-selection-btn"
                        >
                          Back to Account Type
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === "registration-success") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
                <span className="text-xl font-bold text-slate-800">Signedwork</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <Card className="rounded-2xl shadow-xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-600 text-2xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Account Created!</h2>
                  <p className="text-slate-600 mb-8">
                    Your employee account has been successfully created and verified.
                    You can now sign in to access your dashboard.
                  </p>
                  <Button
                    onClick={() => setCurrentView("login")}
                    className="w-full"
                    data-testid="button-go-to-login"
                  >
                    Sign In Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === "verification-pending") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
                <span className="text-xl font-bold text-slate-800">Signedwork</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <Card className="rounded-2xl shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="text-blue-600 text-2xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h2>
                  <p className="text-slate-600">
                    We've sent a verification link to <strong>{verificationEmail}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-left">
                        <p className="text-sm text-blue-800 font-medium">Next Steps:</p>
                        <ol className="text-sm text-blue-700 mt-2 space-y-1">
                          <li>1. Check your email inbox</li>
                          <li>2. Click the verification link</li>
                          <li>3. Your account will be created automatically</li>
                          <li>4. You can then login normally</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        apiRequest("POST", "/api/auth/resend-signup-verification", { email: verificationEmail })
                        .then(() => {
                          toast({
                            title: "Verification Email Resent!",
                            description: "Please check your email inbox again.",
                          });
                        })
                        .catch((error: any) => {
                          toast({
                            title: "Resend Failed",
                            description: error.message || "Failed to resend verification email",
                            variant: "destructive",
                          });
                        });
                      }}
                      variant="outline"
                      className="w-full"
                      data-testid="button-resend-verification"
                    >
                      Resend Verification Email
                    </Button>

                    <Button
                      onClick={() => setCurrentView("selection")}
                      variant="ghost"
                      className="w-full"
                      data-testid="button-back-to-signup"
                    >
                      Back to Sign Up
                    </Button>

                    <p className="text-sm text-slate-600">
                      Already verified?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary hover:text-primary-dark font-medium"
                        onClick={() => setCurrentView("login")}
                      >
                        Sign in
                      </Button>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Default return - should not reach here but prevents compilation errors
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900">Loading...</h2>
      </div>
    </div>
  );
}