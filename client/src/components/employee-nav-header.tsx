import { Link, useLocation } from 'wouter';
import { User, Briefcase, Search, LogOut, Settings, ChevronDown, ShieldCheck, Menu, MessageSquare, BarChart3, Clock } from 'lucide-react';
import { FeedbackButton } from '@/components/FeedbackButton';
import signedworkLogo from "@assets/Signed-work-Logo (1)_1755168042120.png";
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';

interface EmployeeNavHeaderProps {
  employeeId?: string;
  employeeName?: string;
}

export default function EmployeeNavHeader({ employeeId, employeeName }: EmployeeNavHeaderProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, userType, isAuthenticated } = useAuth();
  const [sessionTime, setSessionTime] = useState<string>('24h 0m');

  // Smart navigation function for logo clicks - SECURE VERSION
  const handleLogoClick = async () => {
    try {
      // Always make a fresh API call to verify current authentication status
      const response = await apiRequest("GET", "/api/auth/user");
      
      if (response?.user && response?.userType) {
        // User is authenticated, navigate based on type
        if (response.userType === 'company') {
          setLocation('/company-dashboard');
        } else if (response.userType === 'employee') {
          setLocation('/dashboard');
        } else {
          setLocation('/');
        }
      } else {
        // Not authenticated, go to auth page
        setLocation('/');
      }
    } catch (error) {
      // Authentication failed, go to auth page
      setLocation('/');
    }
  };

  // Fetch current employee data with auto-refresh
  const { data: employee } = useQuery({
    queryKey: ['/api/employee/me'],
    refetchOnWindowFocus: true,
    refetchInterval: 45000, // Auto-refresh every 45 seconds
    refetchOnReconnect: true,
  });

  // Also listen to auth user data for immediate name updates
  const { data: authUser } = useQuery({
    queryKey: ['/api/auth/user'],
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Auto-refresh every minute
    refetchOnReconnect: true,
  });

  // Session status query
  const { data: sessionStatus } = useQuery({
    queryKey: ['/api/auth/session-status'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Update session time display
  useEffect(() => {
    if ((sessionStatus as any)?.remainingTime) {
      setSessionTime((sessionStatus as any).remainingTime);
    }
  }, [sessionStatus]);

  // Session heartbeat to keep session alive (every 15 minutes)
  useEffect(() => {
    const heartbeatInterval = setInterval(async () => {
      try {
        await apiRequest("POST", "/api/auth/heartbeat", {});
      } catch (error) {
        console.log('Session heartbeat failed:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(heartbeatInterval);
  }, []);

  // Use the most current employee data from multiple sources
  const currentEmployee = employee as any;
  const currentAuthUser = (authUser as any)?.user;
  
  // Construct full name with priority: props > employee API > auth user API
  const getDisplayName = () => {
    // Use provided prop first
    if (employeeName) return employeeName;
    
    // Try employee API data
    if (currentEmployee?.firstName && currentEmployee?.lastName) {
      return `${currentEmployee.firstName} ${currentEmployee.lastName}`;
    }
    if (currentEmployee?.firstName) return currentEmployee.firstName;
    if (currentEmployee?.name) return currentEmployee.name;
    
    // Try auth user API data
    if (currentAuthUser?.firstName && currentAuthUser?.lastName) {
      return `${currentAuthUser.firstName} ${currentAuthUser.lastName}`;
    }
    if (currentAuthUser?.firstName) return currentAuthUser.firstName;
    if (currentAuthUser?.name) return currentAuthUser.name;
    
    return null;
  };
  
  const fullDisplayName = getDisplayName();
  const displayEmployeeId = employeeId || currentEmployee?.employeeId || currentAuthUser?.id;

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
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
              data-testid="logo-home-navigation"
            >
              <img src={signedworkLogo} alt="Signedwork" className="h-6 w-6" />
              <div className="flex items-center min-w-0 flex-1">
                <h1 className="text-base md:text-lg font-semibold text-gray-900 whitespace-nowrap">Signedwork</h1>
                {fullDisplayName && (
                  <>
                    {/* Desktop and tablet display */}
                    <span className="text-sm md:text-base font-medium text-gray-600 ml-2 hidden sm:inline whitespace-nowrap">
                      – {fullDisplayName}
                    </span>
                    {/* Mobile display with smart truncation */}
                    <span 
                      className="text-xs font-medium text-gray-600 ml-1 sm:hidden truncate max-w-20"
                      title={fullDisplayName}
                    >
                      – {fullDisplayName.split(' ')[0]}
                    </span>
                  </>
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
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 px-3 py-2 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 shadow-sm"
                    data-testid="button-mobile-nav-menu"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="text-sm font-medium">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 p-2 bg-white shadow-lg border border-gray-200 rounded-lg">
                  {/* Menu Header */}
                  <div className="px-2 py-1 mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Menu className="h-4 w-4" />
                      Navigation Menu
                    </h3>
                  </div>
                  
                  {/* Dashboard - Most Prominent */}
                  <div className="px-1 py-1">
                    <DropdownMenuItem 
                      onClick={() => setLocation('/summary')}
                      className={`flex items-center cursor-pointer font-semibold text-base py-3 px-3 rounded-lg transition-all duration-200 ${getCurrentTab() === 'dashboard' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm' : 'hover:bg-blue-50 hover:border hover:border-blue-200 border border-transparent'}`}
                      data-testid="mobile-nav-dashboard"
                    >
                      <BarChart3 className="h-5 w-5 mr-3 text-blue-600" />
                      <div className="flex flex-col">
                        <span>Dashboard</span>
                        <span className="text-xs font-normal text-muted-foreground">Analytics & Overview</span>
                      </div>
                    </DropdownMenuItem>
                  </div>
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  {/* Other Navigation Options */}
                  <div className="space-y-1">
                    <DropdownMenuItem 
                      onClick={() => setLocation('/profile')}
                      className={`flex items-center cursor-pointer py-3 px-3 rounded-lg transition-all duration-200 ${getCurrentTab() === 'profile' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                      data-testid="mobile-nav-profile"
                    >
                      <User className="h-5 w-5 mr-3 text-gray-600" />
                      <span className="font-medium">Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setLocation('/work-diary')}
                      className={`flex items-center cursor-pointer py-3 px-3 rounded-lg transition-all duration-200 ${getCurrentTab() === 'work-diary' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                      data-testid="mobile-nav-work-diary"
                    >
                      <Briefcase className="h-5 w-5 mr-3 text-gray-600" />
                      <span className="font-medium">Work Diary</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setLocation('/job-discovery')}
                      className={`flex items-center cursor-pointer py-3 px-3 rounded-lg transition-all duration-200 ${getCurrentTab() === 'job-discovery' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                      data-testid="mobile-nav-job-discovery"
                    >
                      <Search className="h-5 w-5 mr-3 text-gray-600" />
                      <span className="font-medium">Job Discovery</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            

            
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
              <DropdownMenuContent align="end" className="w-56">
                {/* User info section */}
                <div className="px-3 py-2 border-b">
                  <div className="text-sm font-medium text-gray-900">
                    {fullDisplayName || 'Employee'}
                  </div>
                  {displayEmployeeId && (
                    <div className="text-xs text-gray-500">ID: {displayEmployeeId}</div>
                  )}

                </div>
                
                {/* Feedback option */}
                <div>
                  <DropdownMenuItem className="flex items-center p-0">
                    <FeedbackButton 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start p-2 h-auto font-normal text-sm"
                      data-testid="account-feedback-button"
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