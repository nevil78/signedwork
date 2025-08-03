import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, LogOut, User, Building, Mail, Phone, MapPin, Calendar, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { toast } = useToast();
  
  const { data: userResponse, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const logout = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userResponse) {
    window.location.href = "/";
    return null;
  }

  const { user, userType } = userResponse as any;
  const isEmployee = userType === "employee";
  
  // Redirect to appropriate dashboard
  if (isEmployee) {
    window.location.href = "/profile";
    return null;
  } else {
    window.location.href = "/company-dashboard";
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="text-primary text-2xl mr-3" />
              <span className="text-xl font-bold text-slate-800">SecureAuth</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Welcome, {isEmployee ? `${user.firstName} ${user.lastName}` : user.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {logout.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isEmployee ? "Employee Dashboard" : "Company Dashboard"}
          </h1>
          <p className="text-slate-600">
            {isEmployee ? "Manage your professional profile and settings" : "Manage your organization and team"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {isEmployee ? <User className="w-5 h-5 mr-2" /> : <Building className="w-5 h-5 mr-2" />}
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEmployee ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">First Name</label>
                        <p className="text-slate-900">{user.firstName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Last Name</label>
                        <p className="text-slate-900">{user.lastName}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-slate-500" />
                      <span className="text-slate-900">{user.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-slate-500" />
                      <span className="text-slate-900">{user.countryCode} {user.phone}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Organization Name</label>
                      <p className="text-slate-900">{user.name}</p>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-slate-500 mt-1" />
                      <div>
                        <p className="text-slate-900">{user.address}</p>
                        <p className="text-slate-600">Pincode: {user.pincode}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-slate-500" />
                      <span className="text-slate-900">{user.email}</span>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-slate-500" />
                      <span className="text-slate-900">CIN/PAN: {user.registrationNumber}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-slate-500" />
                        <span className="text-slate-900">{user.size}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                        <span className="text-slate-900">Est. {user.establishmentYear}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Active Account</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Account created on {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Security Settings
                </Button>
                {!isEmployee && (
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Team
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Shield className="text-primary text-xl mr-2" />
              <span className="text-lg font-semibold text-slate-800">SecureAuth</span>
            </div>
            <div className="flex space-x-6 text-sm text-slate-600">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Security</a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 text-center text-sm text-slate-500">
            <p>&copy; 2024 SecureAuth. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
