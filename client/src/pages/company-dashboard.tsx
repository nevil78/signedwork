import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Copy, Users, Clock, CheckCircle, AlertCircle, FileText, BarChart3, Settings, Briefcase, Mail, UserSearch, ArrowRight, Calendar, UserPlus, LogOut, ChevronDown, ShieldCheck, Menu } from 'lucide-react';
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
import CompanyNavHeader from '@/components/company-nav-header';

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
      {/* Navigation Header */}
      <CompanyNavHeader 
        companyId={user?.companyId} 
        companyName={user?.name} 
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">
            Manage your employees and generate invitation codes
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
            {user?.companyId && (
              <Badge variant="secondary">
                Company ID: {user.companyId}
              </Badge>
            )}
            {(user?.cin || user?.panNumber) && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                {user?.cin && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
        {!isUserLoading && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Verification Details
              </CardTitle>
              <CardDescription>
                {user?.isBasicDetailsLocked 
                  ? "Your verification details have been approved and locked. Contact support for changes."
                  : "Verify your email and add PAN/CIN numbers for complete company verification. Details can be edited until approved by admin."
                }
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

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          
          {/* Core Management Section */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Core Management
            </h2>
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              
              {/* Company Hierarchy Card */}
              <Card 
                className="cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all duration-200" 
                onClick={() => navigate('/company-hierarchy')}
                data-testid="company-hierarchy-card"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Company Hierarchy</CardTitle>
                      <CardDescription className="text-xs">
                        Organization & Teams
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Manage Employees Card */}
              <Card 
                className="cursor-pointer hover:shadow-md hover:border-orange-300 transition-all duration-200" 
                onClick={() => navigate('/company-employees')}
                data-testid="manage-employees-card"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Manage Employees</CardTitle>
                      <CardDescription className="text-xs">
                        Employee Administration
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Work Entry Reviews Card */}
              <Card 
                className="cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200" 
                onClick={() => navigate('/company-work-entries')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Work Entry Reviews</CardTitle>
                      <CardDescription className="text-xs">
                        Review & Approve Work
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Work Verification Card */}
              <Card 
                className="cursor-pointer hover:shadow-md hover:border-green-200 transition-all duration-200" 
                onClick={() => navigate('/work-verification')}
                data-testid="work-verification-card"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Work Verification</CardTitle>
                      <CardDescription className="text-xs">
                        Verification Workflows
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Secondary Tools */}
            <h3 className="text-md font-medium mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              Additional Tools
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              
              {/* Job Postings Card */}
              <Card 
                className="cursor-pointer hover:shadow-sm hover:border-green-200 transition-all duration-200" 
                onClick={() => navigate('/company-jobs')}
              >
                <CardHeader className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-md flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-sm">Job Postings</CardTitle>
                  </div>
                </CardHeader>
              </Card>
              
              {/* Premium Recruitment Card */}
              <Card 
                className="cursor-pointer hover:shadow-sm hover:border-purple-200 transition-all duration-200" 
                onClick={() => navigate('/company-recruiter')}
                data-testid="premium-recruitment-card"
              >
                <CardHeader className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-md flex items-center justify-center">
                      <UserSearch className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-sm">Premium Recruitment</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Quick Actions
            </h2>

            {/* Invitation Code Section */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Invitation Codes</CardTitle>
                <CardDescription className="text-xs">
                  Generate temporary codes for employees
                </CardDescription>
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

            {/* Recent Employees Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">Recent Employees</CardTitle>
                    <CardDescription className="text-xs">
                      {employees.length} total • Last 3 shown
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/company-employees')}
                    className="shrink-0 text-xs"
                    data-testid="button-manage-all-employees"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Manage
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
                <div className="space-y-2">
                  {employees.slice(0, 3).map((employee) => (
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
                  {employees.length > 3 && (
                    <div className="text-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/company-employees')}
                        className="text-primary"
                        data-testid="button-view-all-employees"
                      >
                        View All {employees.length}
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
    </div>
  );
}