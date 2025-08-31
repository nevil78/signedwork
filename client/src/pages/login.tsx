import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, type LoginData } from "@shared/schema";
import { Link, useLocation } from "wouter";
import UnifiedHeader from "@/components/UnifiedHeader";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<boolean>(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("/api/login", "POST", data);
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        setLocation("/dashboard");
      } else {
        setLoginError(true);
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setLoginError(true);
      toast({
        title: "Login Failed", 
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    setLoginError(false);
    loginMutation.mutate(data);
  };

  // Handle OAuth error redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <UnifiedHeader 
        showBackButton={true} 
        showAuthButtons={false}
        currentPage="login"
      />
      
      <div className="flex justify-center items-center min-h-[calc(100vh-120px)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold" data-testid="text-login-title">
              Welcome Back
            </CardTitle>
            <CardDescription data-testid="text-login-description">
              Sign in to your Signedwork account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="john.doe@example.com"
                          className={loginError ? "border-red-500" : ""}
                          data-testid="input-email"
                        />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className={`pr-12 ${loginError ? "border-red-500" : ""}`}
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4 text-slate-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between items-center">
                  <Link href="/forgot-password" data-testid="link-forgot-password">
                    <Button variant="link" className="p-0 h-auto text-sm text-blue-600">
                      Forgot password?
                    </Button>
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>

                {/* Google OAuth Button */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                <a href="/api/auth/google" className="w-full" data-testid="button-google-login">
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
                  Don't have an account?{" "}
                  <Link href="/signup" data-testid="link-signup">
                    <Button variant="link" className="p-0 h-auto text-blue-600">
                      Sign up
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}