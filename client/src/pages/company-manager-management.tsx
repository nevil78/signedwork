import { useState, useEffect, memo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  Plus, 
  Settings, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  UserCheck, 
  Shield,
  Building2,
  Mail,
  Key,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Create Manager Form Schema
const createManagerSchema = z.object({
  managerId: z.string()
    .min(3, "Manager ID must be at least 3 characters")
    .max(8, "Manager ID must be at most 8 characters")
    .regex(/^[A-Z0-9]+$/, "Manager ID must contain only uppercase letters and numbers"),
  managerName: z.string().min(2, "Manager name must be at least 2 characters"),
  managerEmail: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(12, "Password max length should be 12")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  permissionLevel: z.enum(["branch_manager", "team_lead"]),
  branchId: z.string().optional(),
  teamId: z.string().optional(),
});

type CreateManagerData = z.infer<typeof createManagerSchema>;

const CompanyManagerManagement = memo(function CompanyManagerManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<any>(null);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assignEmployeesOpen, setAssignEmployeesOpen] = useState(false);

  // Redirect if not authenticated or not company
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.accountType !== 'company')) {
      toast({
        title: "Access Denied",
        description: "Only company accounts can manage managers.",
        variant: "destructive",
      });
      setLocation("/company-login");
      return;
    }
  }, [isAuthenticated, isLoading, user, toast, setLocation]);

  // Forms
  const createForm = useForm<CreateManagerData>({
    resolver: zodResolver(createManagerSchema),
    defaultValues: {
      managerId: "",
      managerName: "",
      managerEmail: "",
      password: "",
      permissionLevel: "team_lead",
      branchId: "",
      teamId: "",
    },
  });

  // Fetch company managers
  const { data: managers, isLoading: managersLoading } = useQuery({
    queryKey: ["/api/company/managers"],
    enabled: isAuthenticated && user?.accountType === 'company',
    staleTime: 2 * 60 * 1000,
  });

  // Fetch company branches and teams for assignment
  const { data: branches } = useQuery({
    queryKey: ["/api/company/branches"],
    enabled: isAuthenticated && user?.accountType === 'company',
  });

  const { data: teams } = useQuery({
    queryKey: ["/api/company/teams"],
    enabled: isAuthenticated && user?.accountType === 'company',
  });

  // Fetch employees for assignment
  const { data: employees } = useQuery({
    queryKey: ["/api/company/employees"],
    enabled: isAuthenticated && user?.accountType === 'company',
  });

  // Create manager mutation
  const createManagerMutation = useMutation({
    mutationFn: async (data: CreateManagerData) => {
      return await apiRequest("POST", "/api/company/managers", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Manager account created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create manager account",
        variant: "destructive",
      });
    },
  });

  // Update manager permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ managerId, permissions }: { managerId: string; permissions: any }) => {
      return await apiRequest("PATCH", `/api/company/managers/${managerId}/permissions`, permissions);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Manager permissions updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  // Assign employees mutation
  const assignEmployeesMutation = useMutation({
    mutationFn: async ({ managerId, employeeIds }: { managerId: string; employeeIds: string[] }) => {
      return await apiRequest("POST", `/api/company/managers/${managerId}/assign-employees`, { employeeIds });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employees assigned to manager successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      setAssignEmployeesOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign employees",
        variant: "destructive",
      });
    },
  });

  // Deactivate manager mutation
  const deactivateManagerMutation = useMutation({
    mutationFn: async (managerId: string) => {
      return await apiRequest("PATCH", `/api/company/managers/${managerId}/deactivate`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Manager account deactivated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
      setDeleteConfirmOpen(false);
      setSelectedManager(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate manager",
        variant: "destructive",
      });
    },
  });

  const handleCreateManager = (data: CreateManagerData) => {
    createManagerMutation.mutate(data);
  };

  const handlePermissionChange = (managerId: string, permission: string, value: boolean) => {
    updatePermissionsMutation.mutate({
      managerId,
      permissions: { [permission]: value },
    });
  };

  if (isLoading || managersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/company-dashboard")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manager Management</h1>
              <p className="text-gray-600">Create and manage your manager accounts</p>
            </div>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-manager">
                <Plus className="h-4 w-4 mr-2" />
                Create Manager
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Manager Account</DialogTitle>
                <DialogDescription>
                  Create a manager sub-account with specific permissions and employee assignments.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateManager)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="managerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manager ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="AHM123"
                              {...field}
                              data-testid="input-manager-id"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="managerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manager Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ahmed Hassan"
                              {...field}
                              data-testid="input-manager-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="managerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manager Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="ahmed@company.com"
                            {...field}
                            data-testid="input-manager-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            data-testid="input-manager-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="permissionLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Permission Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-permission-level">
                              <SelectValue placeholder="Select permission level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="team_lead">Team Lead</SelectItem>
                            <SelectItem value="branch_manager">Branch Manager</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {branches && branches.length > 0 && (
                    <FormField
                      control={createForm.control}
                      name="branchId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-branch">
                                <SelectValue placeholder="Select branch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No Branch (HQ)</SelectItem>
                              {branches.map((branch: any) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                  {branch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      data-testid="button-cancel-create"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createManagerMutation.isPending}
                      data-testid="button-submit-create"
                    >
                      {createManagerMutation.isPending ? "Creating..." : "Create Manager"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Manager List */}
        <div className="space-y-6">
          {managers && managers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managers.map((manager: any) => (
                <Card 
                  key={manager.id} 
                  className="hover:shadow-lg transition-shadow"
                  data-testid={`manager-card-${manager.uniqueId}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-600" />
                          {manager.managerName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Key className="h-4 w-4" />
                          ID: {manager.uniqueId}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={manager.isActive ? "default" : "secondary"}
                        className={manager.isActive ? "bg-green-100 text-green-800" : ""}
                      >
                        {manager.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{manager.managerEmail}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>{manager.permissionLevel.replace('_', ' ').charAt(0).toUpperCase() + manager.permissionLevel.replace('_', ' ').slice(1)}</span>
                      </div>
                      
                      {manager.lastLoginAt && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Last login: {new Date(manager.lastLoginAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Permissions Display */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Permissions</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          {manager.permissions?.canApproveWork ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span>Approve Work</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {manager.permissions?.canViewAnalytics ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span>View Analytics</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {manager.permissions?.canEditEmployees ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span>Edit Employees</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {manager.permissions?.canInviteEmployees ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span>Invite Employees</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingManager(manager)}
                        data-testid={`button-edit-${manager.uniqueId}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedManager(manager);
                          setAssignEmployeesOpen(true);
                        }}
                        data-testid={`button-assign-${manager.uniqueId}`}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedManager(manager);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-deactivate-${manager.uniqueId}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Managers Created</h3>
                <p className="text-gray-600 mb-4">
                  Create your first manager account to start delegating work approval responsibilities.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Manager
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Manager Permissions Dialog */}
        {editingManager && (
          <Dialog open={!!editingManager} onOpenChange={() => setEditingManager(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Manager Permissions</DialogTitle>
                <DialogDescription>
                  Modify permissions for {editingManager.managerName} ({editingManager.uniqueId})
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="approve-work">Can Approve Work</Label>
                  <Switch
                    id="approve-work"
                    checked={editingManager.permissions?.canApproveWork || false}
                    onCheckedChange={(checked) => handlePermissionChange(editingManager.id, 'canApproveWork', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="view-analytics">Can View Analytics</Label>
                  <Switch
                    id="view-analytics"
                    checked={editingManager.permissions?.canViewAnalytics || false}
                    onCheckedChange={(checked) => handlePermissionChange(editingManager.id, 'canViewAnalytics', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-employees">Can Edit Employees</Label>
                  <Switch
                    id="edit-employees"
                    checked={editingManager.permissions?.canEditEmployees || false}
                    onCheckedChange={(checked) => handlePermissionChange(editingManager.id, 'canEditEmployees', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="invite-employees">Can Invite Employees</Label>
                  <Switch
                    id="invite-employees"
                    checked={editingManager.permissions?.canInviteEmployees || false}
                    onCheckedChange={(checked) => handlePermissionChange(editingManager.id, 'canInviteEmployees', checked)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setEditingManager(null)}>
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Deactivate Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Manager Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate the manager account for {selectedManager?.managerName} ({selectedManager?.uniqueId}).
                They will no longer be able to log in or approve work entries. This action can be reversed later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedManager && deactivateManagerMutation.mutate(selectedManager.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Deactivate Manager
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Employee Assignment Dialog */}
        {assignEmployeesOpen && selectedManager && (
          <Dialog open={assignEmployeesOpen} onOpenChange={setAssignEmployeesOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Employees to Manager</DialogTitle>
                <DialogDescription>
                  Select employees to assign to {selectedManager.managerName} for work approval and management.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {employees && employees.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {employees.map((employee: any) => (
                      <div 
                        key={employee.employeeId} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                            {employee.firstName?.[0]}{employee.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                            <p className="text-sm text-gray-600">{employee.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {employee.assignedManagerId === selectedManager.id ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Assigned
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => assignEmployeesMutation.mutate({
                                managerId: selectedManager.id,
                                employeeIds: [employee.employeeId]
                              })}
                            >
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-8">No employees found</p>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setAssignEmployeesOpen(false)}>
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
});

export default CompanyManagerManagement;