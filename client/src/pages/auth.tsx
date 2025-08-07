import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Shield, User, Building, ArrowLeft, Check, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEmployeeSchema, insertCompanySchema, loginSchema, type InsertEmployee, type InsertCompany, type LoginData } from "@shared/schema";
import { Link } from "wouter";

type AuthView = "selection" | "employee" | "company" | "login" | "success";

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

function PasswordStrengthIndicator({ password }: { password: string }) {
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
}

function PasswordInput({ field, placeholder, className = "" }: { field: any; placeholder: string; className?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="relative">
      <Input
        {...field}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className={`pr-12 ${className}`}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
      </Button>
    </div>
  );
}

export default function AuthPage() {
  const [currentView, setCurrentView] = useState<AuthView>("selection");
  const [loginError, setLoginError] = useState<boolean>(false);
  const { toast } = useToast();

  const employeeForm = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryCode: "+1",
      password: "",
    },
  });

  const companyForm = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      address: "",
      pincode: "",
      registrationNumber: "",
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
      return await apiRequest("POST", "/api/auth/register/employee", data);
    },
    onSuccess: () => {
      setCurrentView("success");
      toast({
        title: "Registration Successful!",
        description: "Your employee account has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create employee account",
        variant: "destructive",
      });
    },
  });

  const companyRegistration = useMutation({
    mutationFn: async (data: InsertCompany) => {
      return await apiRequest("POST", "/api/auth/register/company", data);
    },
    onSuccess: () => {
      setCurrentView("success");
      toast({
        title: "Registration Successful!",
        description: "Your company account has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create company account",
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
        console.log("Redirecting to profile");
        window.location.href = "/profile";
      } else {
        console.log("Redirecting to dashboard");
        window.location.href = "/dashboard";
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

  const onEmployeeSubmit = (data: InsertEmployee) => {
    employeeRegistration.mutate(data);
  };

  const onCompanySubmit = (data: InsertCompany) => {
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
                <Shield className="text-primary text-2xl mr-3" />
                <span className="text-xl font-bold text-slate-800">SecureAuth</span>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-slate-600 hover:text-primary transition-colors">About</a>
                <a href="#" className="text-slate-600 hover:text-primary transition-colors">Support</a>
                <a href="#" className="text-slate-600 hover:text-primary transition-colors">Contact</a>
                <a href="/admin/setup" className="text-slate-600 hover:text-primary transition-colors font-medium">Admin Panel</a>
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
              
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-2">Platform Administration</p>
                <div className="flex gap-2 justify-center">
                  <a 
                    href="/admin/setup" 
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Setup
                  </a>
                  <a 
                    href="/admin/login" 
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Login
                  </a>
                </div>
              </div>
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
                <Shield className="text-primary text-2xl mr-3" />
                <span className="text-xl font-bold text-slate-800">SecureAuth</span>
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={employeeForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={employeeForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={employeeForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
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
                                placeholder="1234567890"
                                className="rounded-l-none border-l-0"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={employeeForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput field={field} placeholder="••••••••" />
                          </FormControl>
                          <PasswordStrengthIndicator password={field.value || ""} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" required />
                      <label htmlFor="terms" className="text-sm text-slate-600">
                        I agree to the{" "}
                        <a href="#" className="text-primary hover:text-primary-dark">Terms of Service</a>{" "}
                        and{" "}
                        <a href="#" className="text-primary hover:text-primary-dark">Privacy Policy</a>
                      </label>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={employeeRegistration.isPending}
                    >
                      {employeeRegistration.isPending ? "Creating Account..." : "Create Employee Account"}
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
                <Shield className="text-primary text-2xl mr-3" />
                <span className="text-xl font-bold text-slate-800">SecureAuth</span>
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Corporation Pvt Ltd" {...field} />
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
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry Sector *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
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
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Size *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Establishment Year *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="2020" 
                                min={1800} 
                                max={new Date().getFullYear()}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                        <p className="text-sm text-slate-600">Registration and compliance details</p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={companyForm.control}
                          name="registrationType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registration Type *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
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
                              <FormLabel>Registration Number *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="L12345MH2020PTC123456" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Address *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Building Name, Street Address, Area" 
                                rows={3}
                                className="resize-none"
                                {...field} 
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
                                <Input placeholder="Mumbai" {...field} />
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contact@acmecorp.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={companyForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password *</FormLabel>
                            <FormControl>
                              <PasswordInput field={field} placeholder="••••••••" />
                            </FormControl>
                            <PasswordStrengthIndicator password={field.value || ""} />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="company-terms" required />
                      <label htmlFor="company-terms" className="text-sm text-slate-600">
                        I agree to the{" "}
                        <a href="#" className="text-primary hover:text-primary-dark">Terms of Service</a>{" "}
                        and{" "}
                        <a href="#" className="text-primary hover:text-primary-dark">Privacy Policy</a>
                      </label>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full py-3" 
                      disabled={companyRegistration.isPending}
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
                <Shield className="text-primary text-2xl mr-3" />
                <span className="text-xl font-bold text-slate-800">SecureAuth</span>
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
                    <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
                    <p className="text-sm text-slate-600">Welcome back! Please sign in to your account</p>
                  </div>
                </div>
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
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
                              <div className="flex items-center justify-center p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-blue-50">
                                <RadioGroupItem value="employee" id="employee" className="sr-only" />
                                <label htmlFor="employee" className="flex items-center cursor-pointer">
                                  <User className="text-primary mr-2" />
                                  <span className="text-sm font-medium">Employee</span>
                                </label>
                              </div>
                              <div className="flex items-center justify-center p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-blue-50">
                                <RadioGroupItem value="company" id="company" className="sr-only" />
                                <label htmlFor="company" className="flex items-center cursor-pointer">
                                  <Building className="text-primary mr-2" />
                                  <span className="text-sm font-medium">Company</span>
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                              className={`${fieldState.error ? 'border-red-500 border-2 animate-error-blink focus:border-red-600' : ''}`}
                              data-testid="login-email-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                              className={`${fieldState.error ? 'border-red-500 border-2 animate-error-blink focus:border-red-600' : ''}`}
                              data-testid="login-password-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <label htmlFor="remember" className="text-sm text-slate-600">Remember me</label>
                      </div>
                      <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark">
                        Forgot password?
                      </Link>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={login.isPending}
                    >
                      {login.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                    
                    <div className="text-center text-sm text-slate-600">
                      Don't have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary hover:text-primary-dark font-medium"
                        onClick={() => setCurrentView("selection")}
                      >
                        Create account
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

  if (currentView === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Shield className="text-primary text-2xl mr-3" />
                <span className="text-xl font-bold text-slate-800">SecureAuth</span>
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

  return null;
}
