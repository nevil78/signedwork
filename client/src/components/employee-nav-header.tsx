import { Link, useLocation } from 'wouter';
import { User, Briefcase, Search, LogOut, Settings, ChevronDown } from 'lucide-react';
import { FeedbackButton } from '@/components/FeedbackButton';
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
    if (location === '/profile') return 'profile';
    if (location === '/work-diary' || location.startsWith('/work-diary/')) return 'work-diary';
    if (location === '/job-discovery') return 'job-discovery';
    if (location === '/change-password') return 'settings';
    return 'profile';
  };

  const handleTabChange = (value: string) => {
    if (value === 'profile') setLocation('/profile');
    else if (value === 'work-diary') setLocation('/work-diary');
    else if (value === 'job-discovery') setLocation('/job-discovery');
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-lg font-semibold text-gray-900">Signedwork</h1>
            <Tabs value={getCurrentTab()} onValueChange={handleTabChange} className="h-full">
              <TabsList className="h-full bg-transparent border-none rounded-none p-0">
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
          <div className="flex items-center space-x-4">
            {displayEmployeeId && (
              <span className="text-sm text-gray-600">{displayEmployeeId}</span>
            )}
            
            <FeedbackButton variant="outline" size="sm" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  data-testid="button-account-menu"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Account
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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