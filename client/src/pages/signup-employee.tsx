import { useState, useEffect, memo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { User, Check, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEmployeeSchema, type InsertEmployee } from "@shared/schema";
import { Link, useLocation } from "wouter";
import UnifiedHeader from "@/components/UnifiedHeader";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import TermsOfServiceModal from "@/components/TermsOfServiceModal";

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

export default function EmployeeSignupPage() {
  const [, setLocation] = useLocation();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryCode: "+1",
      password: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await apiRequest("/api/register/employee", "POST", data);
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully!",
        });
        setLocation("/dashboard");
      } else {
        toast({
          title: "Registration Failed",
          description: data.message || "Failed to create account. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmployee) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <UnifiedHeader 
        showBackButton={true} 
        showAuthButtons={false}
        currentPage="signup"
      />
      
      <div className="flex justify-center items-center min-h-[calc(100vh-120px)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <User className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold" data-testid="text-employee-signup-title">
              Create Professional Account
            </CardTitle>
            <CardDescription data-testid="text-employee-signup-description">
              Join Signedwork as a professional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="John"
                            data-testid="input-first-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Doe"
                            data-testid="input-last-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="john.doe@example.com"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Select
                            value={form.watch("countryCode")}
                            onValueChange={(value) => form.setValue("countryCode", value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+1">+1</SelectItem>
                              <SelectItem value="+91">+91</SelectItem>
                              <SelectItem value="+44">+44</SelectItem>
                              <SelectItem value="+49">+49</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            {...field}
                            placeholder="2345678901"
                            className="ml-2"
                            data-testid="input-phone"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <PasswordInput
                          field={field}
                          placeholder="Create a strong password"
                        />
                      </FormControl>
                      <PasswordStrengthIndicator password={field.value || ""} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    required
                    className="mt-1"
                    data-testid="checkbox-terms"
                  />
                  <div className="text-sm text-slate-600 leading-relaxed">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-blue-600 hover:underline"
                      data-testid="link-terms"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-blue-600 hover:underline"
                      data-testid="link-privacy"
                    >
                      Privacy Policy
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={signupMutation.isPending}
                  data-testid="button-signup"
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Professional Account"}
                </Button>

                {/* Google OAuth Button */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50 px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                <a href="/api/auth/google" className="w-full" data-testid="button-google-signup">
                  <Button type="button" variant="outline" className="w-full">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                </a>

                <div className="text-center text-sm text-slate-600">
                  Already have an account?{" "}
                  <Link href="/login" data-testid="link-login">
                    <Button variant="link" className="p-0 h-auto text-blue-600">
                      Sign in
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
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