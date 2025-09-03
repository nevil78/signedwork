import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Briefcase, 
  BarChart3, 
  MessageSquare,
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Plus,
  FileText,
  Clock,
  DollarSign,
  Star
} from "lucide-react";

export default function ClientNavHeader() {
  const [location] = useLocation();
  
  // Get current user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        window.location.href = "/auth/login";
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path: string) => location.startsWith(path);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/client/dashboard">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SW</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Signedwork</span>
              </div>
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Hire Talent Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`flex items-center space-x-1 ${isActive('/client/hire') ? 'text-blue-600' : 'text-gray-700'}`}
                  data-testid="nav-hire-talent"
                >
                  <Users className="w-4 h-4" />
                  <span>Hire talent</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/client/jobs" className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Manage jobs and offers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/projects" className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Job posts and proposals
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/offers" className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Pending offers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/client/find-freelancers" className="flex items-center">
                    <Search className="w-4 h-4 mr-2" />
                    Find freelancers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/projects/new" className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Post a job
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/search-talent" className="flex items-center">
                    <Search className="w-4 h-4 mr-2" />
                    Search for talent
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/client/hired-talent" className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Talent you've hired
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/saved-talent" className="flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Talent you've saved
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Manage Work Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`flex items-center space-x-1 ${isActive('/client/work') ? 'text-blue-600' : 'text-gray-700'}`}
                  data-testid="nav-manage-work"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Manage work</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/client/work/active" className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Active and past work
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/contracts" className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Your contracts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/client/work/hourly" className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Hourly contract activity
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/work/timesheets" className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Timesheets
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/work/time-by-freelancer" className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Time by freelancer
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/work/verified-diaries" className="flex items-center">
                    <Badge className="w-4 h-4 mr-2 bg-green-600" />
                    Verified Work Diaries ⭐
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/client/work/export" className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Custom export
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Reports Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`flex items-center space-x-1 ${isActive('/client/reports') ? 'text-blue-600' : 'text-gray-700'}`}
                  data-testid="nav-reports"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Reports</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/client/reports/financial" className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Weekly financial summary
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/reports/transactions" className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Transaction history
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/reports/spending" className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Spending by activity
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Messages */}
            <Link href="/client/messages">
              <Button 
                variant="ghost"
                className={`flex items-center space-x-1 ${isActive('/client/messages') ? 'text-blue-600' : 'text-gray-700'}`}
                data-testid="nav-messages"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
              </Button>
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="global-search"
                />
              </div>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" data-testid="notifications">
              <Bell className="w-5 h-5" />
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="user-menu">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.profilePhoto || ""} />
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/client/profile" className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/settings" className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}