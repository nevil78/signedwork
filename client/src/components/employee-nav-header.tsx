import { Link, useLocation } from 'wouter';
import { User, Briefcase, Search, LogOut, Settings, ChevronDown, ShieldCheck, Menu, MessageSquare, BarChart3 } from 'lucide-react';
import { FeedbackButton } from '@/components/FeedbackButton';
import signedworkLogo from "@assets/Signed-work-Logo (1)_1755168042120.png";
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EmployeeNavHeaderProps {
  employeeId?: string;
  employeeName?: string;
}

export default function EmployeeNavHeader({ employeeId, employeeName }: EmployeeNavHeaderProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch employee data if not provided
  const { data: employee } = useQuery({
    queryKey: ['/api/employee/me'],
    enabled: !employeeId && !employeeName,
  });

  const displayEmployeeId = employeeId || (employee as any)?.employeeId;
  const displayEmployeeName = employeeName || (employee as any)?.name;

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

  const getCurrentTab = () => {
    if (location === '/summary') return 'dashboard';
    if (location === '/profile') return 'profile';
    if (location === '/work-diary' || location.startsWith('/work-diary/')) return 'work-diary';
    if (location === '/job-discovery') return 'job-discovery';
    if (location === '/change-password') return 'settings';
    // Don't default to profile - return the actual location or empty string
    return '';
  };

  const handleTabChange = (value: string) => {
    if (value === 'dashboard') setLocation('/summary');
    else if (value === 'profile') setLocation('/profile');
    else if (value === 'work-diary') setLocation('/work-diary');
    else if (value === 'job-discovery') setLocation('/job-discovery');
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 md:space-x-8">
            <div className="flex items-center space-x-2">
              <img src={signedworkLogo} alt="Signedwork" className="h-6 w-6" />
              <div className="flex items-center">
                <h1 className="text-base md:text-lg font-semibold text-gray-900">Signedwork</h1>
                {displayEmployeeName && (
                  <span className="text-sm md:text-base font-medium text-gray-600 ml-2 hidden sm:inline">
                    - {displayEmployeeName}
                  </span>
                )}
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <Tabs value={getCurrentTab()} onValueChange={handleTabChange} className="h-full">
                <TabsList className="h-full bg-transparent border-none rounded-none p-0">
                  <TabsTrigger 
                    value="dashboard" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 rounded-none h-full px-6 font-medium border border-transparent hover:border-gray-200"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profile" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-full px-4"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger 
                    value="work-diary" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-full px-4"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Work Diary
                  </TabsTrigger>
                  <TabsTrigger 
                    value="job-discovery" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-full px-4"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Job Discovery
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Mobile Navigation Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    data-testid="button-mobile-nav-menu"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => setLocation('/summary')}
                    className={`flex items-center cursor-pointer font-medium ${getCurrentTab() === 'dashboard' ? 'bg-blue-50 text-blue-600' : ''}`}
                    data-testid="mobile-nav-dashboard"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/profile')}
                    className={`flex items-center cursor-pointer ${getCurrentTab() === 'profile' ? 'bg-blue-50 text-blue-600' : ''}`}
                    data-testid="mobile-nav-profile"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/work-diary')}
                    className={`flex items-center cursor-pointer ${getCurrentTab() === 'work-diary' ? 'bg-blue-50 text-blue-600' : ''}`}
                    data-testid="mobile-nav-work-diary"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Work Diary
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/job-discovery')}
                    className={`flex items-center cursor-pointer ${getCurrentTab() === 'job-discovery' ? 'bg-blue-50 text-blue-600' : ''}`}
                    data-testid="mobile-nav-job-discovery"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Job Discovery
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Quick Dashboard Access Button */}
            <Button
              onClick={() => setLocation('/summary')}
              variant={getCurrentTab() === 'dashboard' ? 'default' : 'outline'}
              size="sm"
              className="flex items-center gap-2 font-medium"
              data-testid="quick-dashboard-button"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            
            {/* Employee ID - hidden on mobile */}
            {displayEmployeeId && (
              <span className="text-sm text-gray-600 hidden md:block">ID: {displayEmployeeId}</span>
            )}
            
            {/* Feedback button - hidden on mobile */}
            <div className="hidden md:block">
              <FeedbackButton variant="outline" size="sm" />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  data-testid="button-account-menu"
                >
                  <Settings className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Account</span>
                  <ChevronDown className="h-4 w-4 md:ml-2 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Mobile-only user info */}
                <div className="md:hidden px-2 py-2 border-b">
                  <div className="text-sm font-medium text-gray-900">
                    {displayEmployeeName || 'Employee'}
                  </div>
                  {displayEmployeeId && (
                    <div className="text-xs text-gray-500">ID: {displayEmployeeId}</div>
                  )}
                </div>
                
                {/* Mobile-only feedback option */}
                <div className="md:hidden">
                  <DropdownMenuItem className="flex items-center p-0">
                    <FeedbackButton 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start p-2 h-auto font-normal text-sm"
                      data-testid="mobile-feedback-button"
                    />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
                
                <DropdownMenuItem asChild>
                  <Link href="/change-password" className="flex items-center cursor-pointer" data-testid="link-change-password">
                    <Settings className="h-4 w-4 mr-2" />
                    Change Password
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  data-testid="menu-item-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {logout.isPending ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}