import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useManagerAuth } from "@/hooks/useManagerAuth";
import { 
  Users, 
  ArrowLeft, 
  Mail,
  Building2,
  Briefcase,
  Calendar,
  Phone,
  MapPin,
  Clock,
  BarChart,
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function ManagerEmployees() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { manager, isLoading, isAuthenticated } = useManagerAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to view team members.",
        variant: "destructive",
      });
      setLocation("/manager/login");
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  // Fetch assigned employees
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/manager/employees"],
    enabled: isAuthenticated,
  });

  if (isLoading || employeesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation("/manager/dashboard")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                <p className="text-sm text-gray-600">Manage your assigned team members</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">{(manager as any)?.managerName}</p>
              <p className="text-sm text-gray-600">{(manager as any)?.uniqueId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Overview
            </CardTitle>
            <CardDescription>
              Overview of employees assigned to your management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{employees?.length || 0}</p>
                <p className="text-sm text-gray-600">Total Employees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {employees?.filter((emp: any) => emp.isCurrent)?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Active Members</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {employees?.filter((emp: any) => !emp.isCurrent)?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Ex-Employees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(employees?.map((emp: any) => emp.department) || []).size}
                </p>
                <p className="text-sm text-gray-600">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Team Members</h2>
          
          {employees && employees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((employee: any) => (
                <Card 
                  key={employee.employeeId} 
                  className="hover:shadow-lg transition-shadow"
                  data-testid={`employee-card-${employee.employeeId}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={employee.profilePicture} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(employee.firstName, employee.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {employee.position || 'No position set'}
                        </p>
                        <div className="mt-2">
                          <Badge 
                            variant={employee.isCurrent ? "default" : "secondary"}
                            className={employee.isCurrent ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                          >
                            {employee.isCurrent ? 'Active' : 'Ex-Employee'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {employee.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{employee.email}</span>
                        </div>
                      )}
                      
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                      
                      {employee.department && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building2 className="h-4 w-4" />
                          <span>{employee.department}</span>
                        </div>
                      )}
                      
                      {employee.workType && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="h-4 w-4" />
                          <span>{employee.workType}</span>
                        </div>
                      )}
                      
                      {employee.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{employee.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {new Date(employee.joinedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setLocation(`/professional-profile/${employee.employeeId}`)}
                          data-testid={`view-profile-${employee.employeeId}`}
                        >
                          View Profile
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setLocation(`/manager/work-entries?employee=${employee.employeeId}`)}
                          data-testid={`view-work-${employee.employeeId}`}
                        >
                          Work Entries
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any employees assigned to your management yet.
                </p>
                <p className="text-sm text-gray-500">
                  Contact your company administrator to assign team members to your management.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        {employees && employees.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common management tasks for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/manager/work-entries?filter=pending")}
                  className="h-16 flex-col gap-2"
                  data-testid="button-pending-approvals"
                >
                  <Clock className="h-6 w-6" />
                  Pending Approvals
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/manager/analytics")}
                  className="h-16 flex-col gap-2"
                  data-testid="button-team-analytics"
                >
                  <BarChart className="h-6 w-6" />
                  Team Analytics
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/manager/dashboard")}
                  className="h-16 flex-col gap-2"
                  data-testid="button-dashboard"
                >
                  <Home className="h-6 w-6" />
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}