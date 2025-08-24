import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Building2, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import signedworkLogo from "@assets/Signed-work-Logo (1)_1755168042120.png";

export default function ManagerLogin() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    uniqueId: "",
    password: ""
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { uniqueId: string; password: string }) => {
      const response = await apiRequest("/api/manager/auth/login", "POST", data);
      return response;
    },
    onSuccess: () => {
      setLocation("/manager/dashboard");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.uniqueId && formData.password) {
      loginMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
            <img 
              src={signedworkLogo} 
              alt="Signedwork" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Portal</h1>
          <p className="text-gray-600 mt-2">Access your team management dashboard</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-2 justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl text-center">Manager Sign In</CardTitle>
            </div>
            <CardDescription className="text-center">
              Enter your unique manager ID and password
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uniqueId">Manager ID</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="uniqueId"
                    type="text"
                    placeholder="e.g. JNM123"
                    value={formData.uniqueId}
                    onChange={(e) => handleInputChange("uniqueId", e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-manager-id"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Your unique manager ID provided by your company
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pr-10"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {loginMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {loginMutation.error instanceof Error 
                      ? loginMutation.error.message 
                      : "Login failed. Please check your credentials."}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium"
                disabled={loginMutation.isPending || !formData.uniqueId || !formData.password}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Need help accessing your account?
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/")}
                  className="text-blue-600 hover:text-blue-800"
                  data-testid="link-main-login"
                >
                  Back to Main Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Manager portal for team management and work approvals
          </p>
        </div>
      </div>
    </div>
  );
}