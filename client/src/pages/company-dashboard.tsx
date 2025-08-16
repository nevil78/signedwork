import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Copy, Users, Clock, CheckCircle, AlertCircle, FileText, BarChart3, Settings, Briefcase, Mail, UserSearch, ArrowRight, Calendar, UserPlus, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import signedworkLogo from "@assets/Signed-work-Logo (1)_1755168042120.png";
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Company } from '@shared/schema';
import CompanyEmailVerification from '@/components/CompanyEmailVerification';
import { CompanyRegistrationVerification } from '@/components/CompanyRegistrationVerification';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'wouter';
import { useSocket } from '@/hooks/useSocket';
import { FeedbackButton } from '@/components/FeedbackButton';
import { CompanyVerificationEdit } from '@/components/CompanyVerificationEdit';

interface InvitationCode {
  code: string;
  expiresAt: string;
  message: string;
}

interface CompanyEmployee {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  position: string | null;
  joinedAt: string;
}

export default function CompanyDashboard() {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [currentCode, setCurrentCode] = useState<InvitationCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Logout mutation
  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    },
  });

  // Get current user - explicitly type the response structure
  const { data: authResponse, isLoading: isUserLoading } = useQuery<{user: Company}>({
    queryKey: ['/api/auth/user'],
  });
  
  const user = authResponse?.user;

  // Initialize WebSocket for real-time updates
  const { joinCompanyRoom } = useSocket(user?.id);

  // Join company room when user data loads
  useEffect(() => {
    if (user?.id) {
      joinCompanyRoom(user.id);
    }
  }, [user?.id, joinCompanyRoom]);

  // Get company employees
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<CompanyEmployee[]>({
    queryKey: ['/api/company/employees'],
  });

  // Generate invitation code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/company/invitation-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to generate code');
      return response.json();
    },
    onSuccess: (data: InvitationCode) => {
      setCurrentCode(data);
      setIsGeneratingCode(true);
      setCopied(false);
      toast({
        title: "Success",
        description: "Invitation code generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate invitation code",
        variant: "destructive",
      });
    },
  });

  // Check if code has expired
  useEffect(() => {
    if (currentCode) {
      const checkExpiry = setInterval(() => {
        if (new Date() > new Date(currentCode.expiresAt)) {
          setCurrentCode(null);
          setIsGeneratingCode(false);
          setCopied(false);
        }
      }, 1000);

      return () => clearInterval(checkExpiry);
    }
  }, [currentCode]);

  const handleCopyCode = () => {
    if (currentCode) {
      navigator.clipboard.writeText(currentCode.code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Invitation code copied to clipboard",
      });
    }
  };

  const getRemainingTime = () => {
    if (!currentCode) return null;
    const now = new Date();
    const expires = new Date(currentCode.expiresAt);
    const remaining = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
              <span className="text-xl font-bold text-slate-800 dark:text-slate-200">Signedwork</span>
            </div>
            <div className="flex items-center space-x-3">
              <FeedbackButton variant="outline" size="sm" />
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  data-testid="button-company-account-menu"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Account
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/change-password" className="flex items-center cursor-pointer" data-testid="link-company-change-password">
                    <Settings className="h-4 w-4 mr-2" />
                    Change Password
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  data-testid="menu-item-company-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {logout.isPending ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">
            Manage your employees and generate invitation codes
          </p>
          <div className="flex items-center gap-3 mt-3">
            {user?.companyId && (
              <Badge variant="secondary">
                Company ID: {user.companyId}
              </Badge>
            )}
            {(user?.cin || user?.panNumber) && (
              <div className="flex items-center gap-4">
                {user?.cin && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      CIN: {user.cin}
                    </Badge>
                    <Badge 
                      variant={user.cinVerificationStatus === "verified" ? "default" : 
                              user.cinVerificationStatus === "pending" ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {user.cinVerificationStatus === "verified" && (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      )}
                      {user.cinVerificationStatus === "pending" && (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Verification Pending
                        </>
                      )}
                      {user.cinVerificationStatus === "rejected" && (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Verification Rejected
                        </>
                      )}
                    </Badge>
                  </div>
                )}
                {user?.panNumber && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      PAN: {user.panNumber}
                    </Badge>
                    <Badge 
                      variant={user.panVerificationStatus === "verified" ? "default" : 
                              user.panVerificationStatus === "pending" ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {user.panVerificationStatus === "verified" && (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      )}
                      {user.panVerificationStatus === "pending" && (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Verification Pending
                        </>
                      )}
                      {user.panVerificationStatus === "rejected" && (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Verification Rejected
                        </>
                      )}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Verification Details Section */}
        {!isUserLoading && !user?.isBasicDetailsLocked && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Verification Details
              </CardTitle>
              <CardDescription>
                Add your PAN and CIN numbers for verification. These details can be edited until approved by admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyVerificationEdit company={user} />
            </CardContent>
          </Card>
        )}
        
        {/* Loading state for verification section */}
        {isUserLoading && (
          <Card className="mb-8">
            <CardContent className="py-8">
              <div className="text-center text-gray-500">Loading verification details...</div>
            </CardContent>
          </Card>
        )}

        {/* Management Tools Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Management Tools</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
{/* Manage Employees Card */}
            <Card 
              className="cursor-pointer hover:shadow-md hover:border-orange-200 transition-all duration-200" 
              onClick={() => navigate('/company-employees')}
              data-testid="manage-employees-card"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-base font-semibold">Manage Employees</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Advanced employee management with search, filtering, and pagination
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200" onClick={() => navigate('/company-work-entries')}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-base font-semibold">Work Entry Reviews</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Review and verify employee work entries
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md hover:border-green-200 transition-all duration-200" onClick={() => navigate('/company-jobs')}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-base font-semibold">Job Postings</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Create and manage job listings
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md hover:border-purple-200 transition-all duration-200" onClick={() => navigate('/company-recruiter')}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <UserSearch className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-base font-semibold">Recruiter Panel</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  View and manage job applications
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Email Verification Section */}
          <CompanyEmailVerification />

          {/* Registration Verification Section */}
          <CompanyRegistrationVerification />

          {/* Invitation Code Section */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Invitation Codes</CardTitle>
                  <CardDescription className="text-sm">
                    Generate temporary codes for employees
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!isGeneratingCode ? (
                <div className="text-center py-4">
                  <UserPlus className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a code valid for 15 minutes to invite employees.
                  </p>
                  <Button 
                    onClick={() => generateCodeMutation.mutate()}
                    disabled={generateCodeMutation.isPending}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {generateCodeMutation.isPending ? "Generating..." : "Generate Code"}
                  </Button>
                </div>
              ) : currentCode && (
                <div className="space-y-3">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-xl font-mono font-bold tracking-wider text-green-700 dark:text-green-300">
                        {currentCode.code}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyCode}
                        className="h-6 w-6"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {getRemainingTime()}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => generateCodeMutation.mutate()}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto mx-auto block"
                  >
                    Generate New
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employees Section */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Recent Employees</CardTitle>
                    <CardDescription className="text-sm">
                      {employees.length} total • Last 5 shown
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/company-employees')}
                  className="shrink-0"
                  data-testid="button-manage-all-employees"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Manage</span>
                  <span className="sm:hidden">All</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEmployees ? (
                <p className="text-center text-muted-foreground py-4">Loading employees...</p>
              ) : employees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No employees have joined yet. Share an invitation code to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {employees.slice(0, 5).map((employee) => (
                    <div 
                      key={employee.id} 
                      className="p-2 border rounded hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/company-employee/${employee.employeeId}`)}
                      data-testid={`employee-card-${employee.employeeId}`}
                      title="Click to view employee profile"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-primary truncate" data-testid={`employee-name-${employee.employeeId}`}>
                            {employee.employeeName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate" data-testid={`employee-email-${employee.employeeId}`}>
                            {employee.employeeEmail}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {employee.position && (
                            <Badge variant="secondary" className="text-xs mb-1" data-testid={`employee-position-${employee.employeeId}`}>
                              {employee.position}
                            </Badge>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(employee.joinedAt), 'MMM d')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {employees.length > 5 && (
                    <div className="text-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/company-employees')}
                        className="text-primary"
                        data-testid="button-view-all-employees"
                      >
                        View all {employees.length} employees →
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}