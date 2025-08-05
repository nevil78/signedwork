import { Link, useLocation } from 'wouter';
import { User, Clipboard, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface EmployeeNavHeaderProps {
  employeeId?: string;
  employeeName?: string;
}

export default function EmployeeNavHeader({ employeeId, employeeName }: EmployeeNavHeaderProps) {
  const [location] = useLocation();
  const { toast } = useToast();

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

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-8">
            <Link href="/profile">
              <a className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${
                isActive('/profile') 
                  ? 'text-blue-600 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent'
              }`}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </a>
            </Link>
            <Link href="/work-diary">
              <a className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${
                isActive('/work-diary') 
                  ? 'text-blue-600 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent'
              }`}>
                <Clipboard className="h-4 w-4 mr-2" />
                Work Diary
              </a>
            </Link>
            <Link href="/job-discovery">
              <a className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${
                isActive('/job-discovery') 
                  ? 'text-blue-600 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent'
              }`}>
                <Search className="h-4 w-4 mr-2" />
                Job Discovery
              </a>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {employeeId && (
              <span className="text-sm text-gray-600">EMP-{employeeId}</span>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="text-gray-500 hover:text-gray-700"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}