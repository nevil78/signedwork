import { Link, useLocation } from 'wouter';
import { Building2, Users, FileText, Briefcase, UserCheck, LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
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
import { useEffect, useState } from 'react';

interface CompanyNavHeaderProps {
  companyId?: string;
  companyName?: string;
}

export default function CompanyNavHeader({ companyId, companyName }: CompanyNavHeaderProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  // Fetch company data if not provided
  const { data: company } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: !companyId && !companyName,
  });

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

  const displayCompanyId = companyId || (company as any)?.user?.companyId;
  const displayCompanyName = companyName || (company as any)?.user?.name;

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
    if (location === '/company-dashboard') return 'dashboard';
    if (location === '/company-work-entries') return 'work-entries';
    if (location === '/company-recruiter') return 'recruiter';
    if (location === '/change-password') return 'settings';
    return '';
  };

  const handleTabChange = (value: string) => {
    if (value === 'dashboard') setLocation('/company-dashboard');
    else if (value === 'work-entries') setLocation('/company-work-entries');
    else if (value === 'recruiter') setLocation('/company-recruiter');
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 md:space-x-6">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setLocation('/')}
              data-testid="logo-home-navigation"
            >
              <img src={signedworkLogo} alt="Signedwork" className="h-7 w-7" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Signedwork</h1>
                {displayCompanyName && (
                  <p className="text-xs text-gray-500 -mt-1 hidden sm:block">
                    {displayCompanyName}
                  </p>
                )}
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <Tabs value={getCurrentTab()} onValueChange={handleTabChange} className="h-full">
                <TabsList className="h-full bg-transparent border-none rounded-none p-0">
                  <TabsTrigger 
                    value="dashboard" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-full px-6"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger 
                    value="work-entries" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-full px-6"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Work Reviews
                  </TabsTrigger>
                  <TabsTrigger 
                    value="recruiter" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-full px-6"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Recruiter
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
                    data-testid="button-company-mobile-nav-menu"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="text-sm font-medium">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 p-2 bg-white shadow-lg border border-gray-200 rounded-lg">
                  
                  {/* Dashboard - Most Prominent */}
                  <div className="px-1 py-1">
                    <DropdownMenuItem 
                      onClick={() => setLocation('/company-dashboard')}
                      className={`flex items-center cursor-pointer font-semibold text-base py-3 px-3 rounded-lg transition-all duration-200 ${getCurrentTab() === 'dashboard' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm' : 'hover:bg-blue-50 hover:border hover:border-blue-200 border border-transparent'}`}
                      data-testid="mobile-nav-company-dashboard"
                    >
                      <Building2 className="h-5 w-5 mr-3 text-blue-600" />
                      <div className="flex flex-col">
                        <span>Dashboard</span>
                        <span className="text-xs font-normal text-muted-foreground">Company Overview</span>
                      </div>
                    </DropdownMenuItem>
                  </div>
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  {/* Other Navigation Options */}
                  <div className="space-y-1">
                    <DropdownMenuItem 
                      onClick={() => setLocation('/company-work-entries')}
                      className={`flex items-center cursor-pointer py-3 px-3 rounded-lg transition-all duration-200 ${getCurrentTab() === 'work-entries' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                      data-testid="mobile-nav-company-work-entries"
                    >
                      <FileText className="h-5 w-5 mr-3 text-gray-600" />
                      <span className="font-medium">Work Reviews</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setLocation('/company-recruiter')}
                      className={`flex items-center cursor-pointer py-3 px-3 rounded-lg transition-all duration-200 ${getCurrentTab() === 'recruiter' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                      data-testid="mobile-nav-company-recruiter"
                    >
                      <UserCheck className="h-5 w-5 mr-3 text-gray-600" />
                      <span className="font-medium">Recruiter</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Feedback Button */}
            <FeedbackButton 
              variant="outline" 
              size="sm" 
              className="hidden md:flex"
              data-testid="company-feedback-button"
            />
            
            {/* Account Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                  data-testid="button-company-account-menu"
                >
                  <Settings className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Account</span>
                  <ChevronDown className="h-3 w-3 md:ml-1 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Simplified feedback for mobile */}
                <div className="md:hidden">
                  <DropdownMenuItem className="flex items-center p-0">
                    <FeedbackButton 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start p-2 h-auto font-normal text-sm"
                      data-testid="company-feedback-button-mobile"
                    />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
                
                <DropdownMenuItem asChild>
                  <Link href="/company-settings" className="flex items-center cursor-pointer" data-testid="link-company-settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                
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
    </div>
  );
}