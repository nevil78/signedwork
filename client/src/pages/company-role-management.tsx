import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Shield, UserCheck, Mail, Settings, Eye, Clock, CheckCircle, AlertCircle, User } from "lucide-react";
import { useCompanyRoleGuard } from "@/hooks/useCompanyRoleGuard";

// Company Role Management Page - STEP 2 Implementation
export default function CompanyRoleManagement() {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [newRole, setNewRole] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("MANAGER");

  // Role guard - only COMPANY_ADMIN can access this page
  const { isAuthorized: hasAccess, isLoading: roleLoading } = useCompanyRoleGuard({ allowedRoles: ['COMPANY_ADMIN'] });

  // Fetch company employees with their current roles
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/company/employees/with-roles'],
    enabled: hasAccess,
  });

  // Fetch pending manager invitations
  const { data: pendingInvites = [], isLoading: invitesLoading } = useQuery({
    queryKey: ['/api/company/manager-invites/pending'],
    enabled: hasAccess,
  });

  // Handle access denied - redirect to company dashboard
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You need Company Admin permissions to access role management.
            </p>
            <Button 
              onClick={() => window.location.href = '/company-dashboard'}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mutation to update employee role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ employeeId, role }: { employeeId: string; role: string }) => {
      return apiRequest(`/api/company/employees/${employeeId}/role`, 'PATCH', { role });
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "Employee role has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company/employees/with-roles'] });
      setSelectedEmployee("");
      setNewRole("");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update employee role.",
        variant: "destructive",
      });
    },
  });

  // Mutation to invite manager
  const inviteManagerMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      return apiRequest('/api/company/invite-manager', 'POST', { email, role });
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Manager invitation has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company/manager-invites/pending'] });
      setInviteEmail("");
      setInviteRole("MANAGER");
    },
    onError: (error: any) => {
      toast({
        title: "Invitation Failed",
        description: error.message || "Failed to send manager invitation.",
        variant: "destructive",
      });
    },
  });

  // Show loading or access denied
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need Company Admin permissions to access role management.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Role Management</h1>
          <p className="text-gray-600">Manage company roles and permissions for your team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Employees & Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Employee Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {employees?.map((employee: any) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                          <p className="text-sm text-gray-500">{employee.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={employee.role === 'COMPANY_ADMIN' ? 'default' : 'secondary'}>
                          {employee.role || 'EMPLOYEE'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEmployee(employee.id)}
                          data-testid={`button-edit-role-${employee.id}`}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Role Update Form */}
              {selectedEmployee && (
                <div className="mt-6 p-4 border-t">
                  <h3 className="font-medium mb-4">Update Employee Role</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="role-select">New Role</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMPLOYEE">Employee</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="COMPANY_ADMIN">Company Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateRoleMutation.mutate({ employeeId: selectedEmployee, role: newRole })}
                        disabled={!newRole || updateRoleMutation.isPending}
                        data-testid="button-update-role"
                      >
                        {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedEmployee("");
                          setNewRole("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manager Invitations */}
          <div className="space-y-8">
            {/* Invite New Manager */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Invite Manager
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="manager@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      data-testid="input-invite-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invite-role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="COMPANY_ADMIN">Company Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => inviteManagerMutation.mutate({ email: inviteEmail, role: inviteRole })}
                    disabled={!inviteEmail || inviteManagerMutation.isPending}
                    className="w-full"
                    data-testid="button-send-invite"
                  >
                    {inviteManagerMutation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Invitations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invitesLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : pendingInvites?.length > 0 ? (
                  <div className="space-y-3">
                    {pendingInvites.map((invite: any) => (
                      <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{invite.email}</p>
                          <p className="text-sm text-gray-500">Role: {invite.role}</p>
                        </div>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No pending invitations</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Role Permissions Reference */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role Permissions Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-blue-600 mb-2">Company Admin</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Full company access</li>
                  <li>• Manage all employees</li>
                  <li>• Assign manager roles</li>
                  <li>• Company settings</li>
                  <li>• View all reports</li>
                  <li>• Approve any work entry</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-green-600 mb-2">Manager</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Manage direct reports</li>
                  <li>• Approve team work</li>
                  <li>• View team reports</li>
                  <li>• Limited settings access</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-600 mb-2">Employee</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Manage own profile</li>
                  <li>• Submit work entries</li>
                  <li>• View own data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}