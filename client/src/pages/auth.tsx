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
import { insertEmployeeSchema, insertCompanySchema, loginSchema, type InsertEmployee, type InsertCompany, type LoginData } from "@shared/schema";
import { Link } from "wouter";
import { PrefetchLink } from "@/components/PrefetchLink";

type AuthView = "selection" | "employee" | "company" | "login" | "success" | "otp-verification" | "verification-pending" | "registration-success" | "employee-register" | "company-register";

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
  // Check URL parameters for initial view
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view') as AuthView | null;
  
  const [currentView, setCurrentView] = useState<AuthView>(viewParam || "login");
  const [loginError, setLoginError] = useState<boolean>(false);
  const [verificationEmail, setVerificationEmail] = useState<string>("");
  const [otp, setOTP] = useState("");
  const [countdown, setCountdown] = useState(60); // 1 minute
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Handle URL view parameters dynamically
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentViewParam = urlParams.get('view') as AuthView | null;
    
    if (currentViewParam) {
      // Map legacy view names to current view names
      if (currentViewParam === 'employee-register') {
        setCurrentView('employee');
      } else if (currentViewParam === 'company-register') {
        setCurrentView('company');
      } else if (currentViewParam as AuthView) {
        setCurrentView(currentViewParam as AuthView);
      }
    }
  }, []);

  // Handle OAuth error redirects
  useEffect(() => {
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
    const hasError = fieldState?.error || fieldErrors[fieldName];
    
    if (hasError) {
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
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      name: "",
      address: "",
      pincode: "",
      registrationNumber: "",
      cin: "",
      panNumber: "",
      email: "",
      size: "",
      establishmentYear: new Date().getFullYear(),
      password: "",
    },
  });

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      accountType: "employee",
    },
  });

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
        window.location.href = "/summary";
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
        description: data.description,
        industryType: data.industry,
        companySize: data.size,
        location: data.address,
        email: data.email,
        password: data.password,
        cin: data.cin,
        panNumber: data.panNumber
      });
    },
    onSuccess: (response: any) => {
      setVerificationEmail(companyForm.getValues("email"));
      setCurrentView("verification-pending");
      toast({
        title: "Verification Email Sent!",
        description: response.message || "Please check your email to verify your account.",
      });
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

  const login = useMutation({
    mutationFn: async (data: LoginData) => {
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: (response: any) => {
      console.log("Login successful, response:", response);
      // Redirect based on user type
      if (response.userType === "employee") {
        console.log("Redirecting to employee summary dashboard");
        window.location.href = "/summary";
      } else {
        console.log("Redirecting to company dashboard");
        window.location.href = "/company-dashboard";
      }
    },
    onError: (error: any) => {
      // Always show user-friendly message for authentication errors
      const isAuthError = error.message?.includes("Invalid email or password") || 
                         error.message?.includes("401") ||
                         error.status === 401;
      
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
    const requiredFields = ['name', 'industry', 'size', 'establishmentYear', 'address', 'email', 'password'];
    let hasEmptyFields = false;
    const newErrors: Record<string, boolean> = {};
    
    requiredFields.forEach(field => {
      const value = data[field as keyof InsertCompany];
      if (!value || value.toString().trim() === "") {
        newErrors[field] = true;
        hasEmptyFields = true;
      } else {
        newErrors[field] = false;
      }
    });
    
    // Check company terms checkbox
    const companyTermsCheckbox = document.getElementById('company-terms') as HTMLInputElement;
    if (!companyTermsCheckbox?.checked) {
      newErrors.companyTerms = true;
      hasEmptyFields = true;
    } else {
      newErrors.companyTerms = false;
    }
    
    setFieldErrors(prev => ({ ...prev, ...newErrors }));
    return !hasEmptyFields;
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

  const onLoginSubmit = (data: LoginData) => {
    // Clear previous login errors when attempting new login
    setLoginError(false);
    loginForm.clearErrors();
    login.mutate(data);
  };

  if (currentView === "selection") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
                <span className="text-xl font-bold text-slate-800">Signedwork</span>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="/about" className="text-slate-600 hover:text-primary transition-colors">About</a>
                <a href="/support" className="text-slate-600 hover:text-primary transition-colors">Support</a>
                <a href="/contact" className="text-slate-600 hover:text-primary transition-colors">Contact</a>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome</h1>
              <p className="text-slate-600">Choose your account type to get started</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={employeeForm.control}
                        name="firstName"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John" 
                                {...field}
                                className={getFieldErrorClass("firstName", fieldState)}
                                onChange={(e) => {
                                  // Auto-capitalize first letter
                                  const value = e.target.value;
                                  const capitalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                                  field.onChange(capitalized);
                                  // Clear error on change
                                  if (value.trim()) {
                                    setFieldErrors(prev => ({ ...prev, firstName: false }));
                                  }
                                }}
                                onBlur={() => handleFieldBlur("firstName")}
                                style={{ textTransform: 'capitalize' }}
                                data-testid="input-firstName"
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
                                placeholder="Doe" 
                                {...field}
                                className={getFieldErrorClass("lastName", fieldState)}
                                onChange={(e) => {
                                  // Auto-capitalize first letter
                                  const value = e.target.value;
                                  const capitalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                                  field.onChange(capitalized);
                                  // Clear error on change
                                  if (value.trim()) {
                                    setFieldErrors(prev => ({ ...prev, lastName: false }));
                                  }
                                }}
                                onBlur={() => handleFieldBlur("lastName")}
                                style={{ textTransform: 'capitalize' }}
                                data-testid="input-lastName"
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
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="john.doe@example.com" 
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
                      render={({ field, fieldState }) => {
                        const countryCode = employeeForm.watch("countryCode");
                        const getPlaceholder = (code: string) => {
                          switch (code) {
                            case '+91': return "9876543210";
                            case '+1': return "2345678901";
                            case '+44': return "2012345678";
                            case '+49': return "3012345678";
                            default: return "1234567890";
                          }
                        };
                        
                        const getMaxLength = (code: string) => {
                          switch (code) {
                            case '+91': return 10;
                            case '+1': return 10;
                            case '+44': return 11;
                            case '+49': return 12;
                            default: return 15;
                          }
                        };

                        return (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <FormField
                                  control={employeeForm.control}
                                  name="countryCode"
                                  render={({ field: countryField }) => (
                                    <Select onValueChange={countryField.onChange} defaultValue={countryField.value}>
                                      <SelectTrigger className="w-20 rounded-r-none">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="+1">+1</SelectItem>
                                        <SelectItem value="+91">+91</SelectItem>
                                        <SelectItem value="+44">+44</SelectItem>
                                        <SelectItem value="+49">+49</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                                <Input
                                  type="tel"
                                  placeholder={getPlaceholder(countryCode || "+1")}
                                  className={`rounded-l-none border-l-0 ${getFieldErrorClass("phone", fieldState)}`}
                                  maxLength={getMaxLength(countryCode || "+1")}
                                  {...field}
                                  onChange={(e) => {
                                    // Allow only digits
                                    const value = e.target.value.replace(/\D/g, '');
                                    field.onChange(value);
                                    // Clear error on change
                                    if (value.trim()) {
                                      setFieldErrors(prev => ({ ...prev, phone: false }));
                                    }
                                  }}
                                  onBlur={() => handleFieldBlur("phone")}
                                  data-testid="input-phone"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
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
                        <PrefetchLink href="/terms?from=employee-registration" className="text-primary hover:text-primary-dark">
                          Terms of Service
                        </PrefetchLink>{" "}
                        and{" "}
                        <PrefetchLink href="/privacy?from=employee-registration" className="text-primary hover:text-primary-dark">
                          Privacy Policy
                        </PrefetchLink>
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
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
      </div>
    );
  }

  if (currentView === "company") {
    const industries = [
      "Technology",
      "Healthcare", 
      "Finance",
      "Education",
      "Manufacturing",
      "Retail",
      "Construction",
      "Transportation",
      "Energy",
      "Media & Entertainment",
      "Real Estate",
      "Consulting",
      "Food & Beverage",
      "Telecommunications",
      "Government",
      "Non-profit",
      "Other"
    ];

    const indianStates = [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
      "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
      "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
      "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
      "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
          <div className="max-w-3xl mx-auto">
            <Card className="rounded-2xl shadow-xl">
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
                  <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-8">
                    {/* Company Information Section */}
                    <div className="space-y-6">
                      <div className="border-b border-slate-200 pb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Company Information</h3>
                        <p className="text-sm text-slate-600">Basic details about your organization</p>
                      </div>
                      
                      <FormField
                        control={companyForm.control}
                        name="name"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Organization Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Acme Corporation Pvt Ltd" 
                                {...field}
                                className={getFieldErrorClass("name", fieldState)}
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (e.target.value.trim()) {
                                    setFieldErrors(prev => ({ ...prev, name: false }));
                                  }
                                }}
                                onBlur={() => handleFieldBlur("name")}
                                data-testid="input-company-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={companyForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Brief description of your company's mission, services, and values..."
                                rows={4}
                                className="resize-none"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={companyForm.control}
                          name="industry"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>Industry Sector *</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                if (value) {
                                  setFieldErrors(prev => ({ ...prev, industry: false }));
                                }
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className={getFieldErrorClass("industry", fieldState)}>
                                    <SelectValue placeholder="Select industry" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {industries.map((industry) => (
                                    <SelectItem key={industry} value={industry}>
                                      {industry}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyForm.control}
                          name="size"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>Company Size *</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                if (value) {
                                  setFieldErrors(prev => ({ ...prev, size: false }));
                                }
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className={getFieldErrorClass("size", fieldState)}>
                                    <SelectValue placeholder="Select size" />
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={companyForm.control}
                        name="establishmentYear"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Establishment Year *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="2020" 
                                min={1800} 
                                max={new Date().getFullYear()}
                                {...field}
                                className={getFieldErrorClass("establishmentYear", fieldState)}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  field.onChange(value);
                                  if (value > 0) {
                                    setFieldErrors(prev => ({ ...prev, establishmentYear: false }));
                                  }
                                }}
                                onBlur={() => handleFieldBlur("establishmentYear")}
                                data-testid="input-establishment-year"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Legal Information Section */}
                    <div className="space-y-6">
                      <div className="border-b border-slate-200 pb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Legal Information</h3>
                        <p className="text-sm text-slate-600">
                          Optional: CIN number enhances company verification and credibility.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={companyForm.control}
                          name="registrationType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registration Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Skip or select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="CIN">CIN (Corporate Identification Number)</SelectItem>
                                  <SelectItem value="PAN">PAN (Permanent Account Number)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyForm.control}
                          name="registrationNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registration Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Optional - can be added later" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={companyForm.control}
                        name="panNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PAN Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ABCDE1234F (Optional)" 
                                {...field}
                                className="uppercase"
                                maxLength={10}
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              />
                            </FormControl>
                            <p className="text-xs text-slate-500">
                              10-character PAN number. Format: ABCDE1234F
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={companyForm.control}
                        name="cin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Corporate Identification Number (CIN)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="L12345AB2020PLC123456 (Optional)" 
                                {...field}
                                className="uppercase"
                                maxLength={21}
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              />
                            </FormControl>
                            <p className="text-xs text-slate-500">
                              21-character CIN number from MCA registration. Format: L12345AB2020PLC123456
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Address Information Section */}
                    <div className="space-y-6">
                      <div className="border-b border-slate-200 pb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Headquarters Address</h3>
                        <p className="text-sm text-slate-600">Primary business location</p>
                      </div>
                      
                      <FormField
                        control={companyForm.control}
                        name="address"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Business Address *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Building Name, Street Address, Area" 
                                rows={3}
                                className={`resize-none ${getFieldErrorClass("address", fieldState)}`}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (e.target.value.trim()) {
                                    setFieldErrors(prev => ({ ...prev, address: false }));
                                  }
                                }}
                                onBlur={() => handleFieldBlur("address")}
                                data-testid="input-business-address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField
                          control={companyForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Mumbai" 
                                  {...field}
                                  onChange={(e) => {
                                    // Auto-capitalize first letter of each word
                                    const value = e.target.value;
                                    const capitalized = value.replace(/\b\w/g, l => l.toUpperCase());
                                    field.onChange(capitalized);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select state" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {indianStates.map((state) => (
                                    <SelectItem key={state} value={state}>
                                      {state}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyForm.control}
                          name="pincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pincode *</FormLabel>
                              <FormControl>
                                <Input placeholder="400001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Account Information Section */}
                    <div className="space-y-6">
                      <div className="border-b border-slate-200 pb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Account Information</h3>
                        <p className="text-sm text-slate-600">Login credentials and contact details</p>
                      </div>
                      
                      <FormField
                        control={companyForm.control}
                        name="email"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Company Email *</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="contact@acmecorp.com" 
                                {...field}
                                className={getFieldErrorClass("email", fieldState)}
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (e.target.value.trim()) {
                                    setFieldErrors(prev => ({ ...prev, email: false }));
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
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="company-terms" 
                        required 
                        className={fieldErrors.companyTerms ? "field-error" : ""}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFieldErrors(prev => ({ ...prev, companyTerms: false }));
                          }
                        }}
                        data-testid="checkbox-company-terms"
                      />
                      <label htmlFor="company-terms" className="text-sm text-slate-600">
                        I agree to the{" "}
                        <PrefetchLink href="/terms?from=company-registration" className="text-primary hover:text-primary-dark">
                          Terms of Service
                        </PrefetchLink>{" "}
                        and{" "}
                        <PrefetchLink href="/privacy?from=company-registration" className="text-primary hover:text-primary-dark">
                          Privacy Policy
                        </PrefetchLink>
                      </label>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full py-3" 
                      disabled={companyRegistration.isPending}
                      onClick={(e) => {
                        // Validate immediately when button is clicked to show red borders
                        validateCompanyForm();
                      }}
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
      </div>
    );
  }

  if (currentView === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
                <span className="text-xl font-bold text-slate-800">Signedwork</span>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="/about" className="text-slate-600 hover:text-primary transition-colors">About</a>
                <a href="/support" className="text-slate-600 hover:text-primary transition-colors">Support</a>
                <a href="/contact" className="text-slate-600 hover:text-primary transition-colors">Contact</a>
              </nav>
            </div>
          </div>
        </header>

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
            
            {/* Main Sign In Box - Fixed size container - CORE FORM ONLY */}
            <Card className="rounded-2xl shadow-xl">
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
                              className="grid grid-cols-2 gap-2"
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
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value.trim()) {
                                  setLoginError(false);
                                }
                              }}
                              data-testid="login-password-input"
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
            
            {/* Google Sign In - Outside the box, only for employees */}
            {loginForm.watch("accountType") === "employee" && (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50 px-2 text-slate-500">Or</span>
                  </div>
                </div>

                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = `/api/auth/google?t=${Date.now()}`}
                  data-testid="button-google-signin"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>
              </div>
            )}
            
            {/* Sign Up Link - Outside the box, displayed below */}
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
            
          </div>
        </main>
      </div>
    );
  }

  if (currentView === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
                        Sign in here
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

  // Fallback for any unhandled currentView values
  console.log('Unhandled currentView:', currentView, 'redirecting to login');
  
  // Use setTimeout instead of useEffect to avoid hooks violation
  setTimeout(() => {
    setCurrentView('login');
  }, 0);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600 mb-4">Loading...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}
