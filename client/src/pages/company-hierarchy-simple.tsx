import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Users, 
  Plus, 
  User,
  UserPlus,
  Crown,
  Shield,
  CheckCircle,
  UserCog
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import CompanyNavHeader from "@/components/company-nav-header";

export default function CompanyHierarchySimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog states
  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  
  // Manager creation states
  const [isCreateManagerOpen, setIsCreateManagerOpen] = useState(false);
  const [isManageManagerOpen, setIsManageManagerOpen] = useState(false);
  const [selectedManagerForEdit, setSelectedManagerForEdit] = useState<any>(null);
  const [newManager, setNewManager] = useState({ firstName: "", lastName: "", email: "", password: "", username: "" });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newTempPassword, setNewTempPassword] = useState("");
  const [passwordResetForm, setPasswordResetForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showToggleConfirmDialog, setShowToggleConfirmDialog] = useState(false);
  
  // Form states
  const [newBranch, setNewBranch] = useState({ name: "", location: "" });
  const [newTeam, setNewTeam] = useState({ name: "", branchId: "", teamManagerId: "" });
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedManager, setSelectedManager] = useState<string>("");

  // Fetch data
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/company/employees"],
    queryFn: () => apiRequest("GET", "/api/company/employees")
  });

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ["/api/company/branches"],
    queryFn: () => apiRequest("GET", "/api/company/branches")
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/company/teams"],
    queryFn: () => apiRequest("GET", "/api/company/teams")
  });

  // Fetch managers data (real managers, not employee hierarchy)
  const { data: managers, isLoading: managersLoading } = useQuery({
    queryKey: ["/api/company/managers"],
    queryFn: () => apiRequest("GET", "/api/company/managers")
  });

  // Mutations
  const createBranchMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/company/branches", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/branches"] });
      setIsCreateBranchOpen(false);
      setNewBranch({ name: "", location: "" });
      toast({ title: "Success", description: "Branch created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create branch", variant: "destructive" });
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/company/teams", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/teams"] });
      setIsCreateTeamOpen(false);
      setNewTeam({ name: "", branchId: "", teamManagerId: "" });
      toast({ title: "Success", description: "Team created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create team", variant: "destructive" });
    }
  });

  const assignEmployeeMutation = useMutation({
    mutationFn: ({ employeeId, assignment }: { employeeId: string; assignment: any }) => 
      apiRequest("PATCH", `/api/company/employees/${employeeId}/hierarchy-role`, assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      toast({ title: "Success", description: "Employee assigned successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign employee", variant: "destructive" });
    }
  });

  // Toggle manager status mutation
  const toggleManagerStatusMutation = useMutation({
    mutationFn: async ({ managerId, isActive }: { managerId: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/company/managers/${managerId}/status`, { isActive });
    },
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      toast({ 
        title: "Success", 
        description: `Manager ${variables.isActive ? 'enabled' : 'disabled'} successfully` 
      });
      setIsManageManagerOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update manager status", 
        variant: "destructive" 
      });
    }
  });

  // Helper functions
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "company_admin": return <Crown className="w-4 h-4 text-purple-600" />;
      case "branch_manager": return <Shield className="w-4 h-4 text-green-600" />;
      case "team_lead": return <Users className="w-4 h-4 text-blue-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBranchName = (branchId: string) => {
    if (!branchId) return "Headquarters";
    const branch = branches?.find((b: any) => b.id === branchId);
    return branch?.name || "Unknown Branch";
  };

  const getTeamName = (teamId: string) => {
    if (!teamId) return "No Team";
    const team = teams?.find((t: any) => t.id === teamId);
    return team?.name || "Unknown Team";
  };

  const handleAddMembers = (team: any) => {
    setSelectedTeam(team);
    setSelectedEmployees([]);
    setSelectedManager("");
    setIsAddMembersOpen(true);
  };

  // Query to get current team memberships
  const { data: currentTeamMemberships } = useQuery({
    queryKey: ["/api/company/teams", selectedTeam?.id, "memberships"],
    queryFn: () => apiRequest("GET", `/api/company/teams/${selectedTeam?.id}/memberships`),
    enabled: !!selectedTeam?.id && isAddMembersOpen
  });

  // Query to get all employee teams for showing which teams they're already in
  const { data: allEmployeeTeams } = useQuery({
    queryKey: ["/api/company/employees", "all-teams"],
    queryFn: async () => {
      if (!employees || !Array.isArray(employees)) return {};
      
      const employeeTeams: any = {};
      
      // Get teams for each employee
      for (const emp of employees) {
        try {
          const teams = await apiRequest("GET", `/api/company/employees/${emp.employeeId}/teams`);
          employeeTeams[emp.employeeId] = teams;
        } catch (error) {
          employeeTeams[emp.employeeId] = [];
        }
      }
      
      return employeeTeams;
    },
    enabled: !!employees && isAddMembersOpen
  });

  const handleManageTeam = (team: any) => {
    setSelectedTeam(team);
    setIsManageTeamOpen(true);
  };

  // Query to get team memberships for manage dialog
  const { data: manageTeamMemberships } = useQuery({
    queryKey: ["/api/company/teams", selectedTeam?.id, "memberships"],
    queryFn: () => apiRequest("GET", `/api/company/teams/${selectedTeam?.id}/memberships`),
    enabled: !!selectedTeam?.id && isManageTeamOpen
  });

  const handleRemoveFromTeam = async (employeeId: string, teamId: string) => {
    try {
      await apiRequest("DELETE", `/api/company/teams/${teamId}/members/${employeeId}`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/teams"] });
      toast({ title: "Success", description: "Employee removed from team" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to remove employee from team", variant: "destructive" });
    }
  };

  const handleChangeManager = async (newManagerId: string) => {
    if (!selectedTeam) return;
    
    try {
      // Update new manager role
      await apiRequest("PATCH", `/api/company/employees/${newManagerId}/hierarchy-role`, {
        teamId: selectedTeam.id,
        hierarchyRole: "team_lead",
        branchId: selectedTeam.branchId,
        canVerifyWork: true,
        canManageEmployees: true,
        verificationScope: "team"
      });
      
      // Find and demote old manager to employee
      if (Array.isArray(employees)) {
        const oldManager = employees.find((emp: any) => 
          emp.teamId === selectedTeam.id && 
          (emp.hierarchyRole === "team_lead" || emp.hierarchyRole === "branch_manager")
        );
        
        if (oldManager && oldManager.employeeId !== newManagerId) {
          await apiRequest("PATCH", `/api/company/employees/${oldManager.employeeId}/hierarchy-role`, {
            teamId: selectedTeam.id,
            hierarchyRole: "employee",
            branchId: selectedTeam.branchId,
            canVerifyWork: false,
            canManageEmployees: false,
            verificationScope: "none"
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      toast({ title: "Success", description: "Team manager updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update team manager", variant: "destructive" });
    }
  };

  const handleCreateBranch = () => {
    if (newBranch.name.trim() && newBranch.location.trim()) {
      createBranchMutation.mutate(newBranch);
    }
  };

  const handleCreateTeam = () => {
    if (newTeam.name.trim() && newTeam.branchId) {
      createTeamMutation.mutate({
        name: newTeam.name,
        branchId: newTeam.branchId === "headquarters" ? null : newTeam.branchId,
        teamManagerId: newTeam.teamManagerId === "none" ? null : newTeam.teamManagerId || null,
        maxMembers: 10
      });
    }
  };

  const handleSaveBulkAssignment = async () => {
    if (selectedTeam && selectedEmployees.length > 0) {
      try {
        // Only update team manager if team doesn't have one and manager is selected
        if (!selectedTeam.teamManagerId && selectedManager) {
          await apiRequest("PATCH", `/api/company/teams/${selectedTeam.id}`, {
            teamManagerId: selectedManager
          });
        }

        // Add employees to team using new team membership API
        await apiRequest("POST", `/api/company/teams/${selectedTeam.id}/members`, {
          employeeIds: selectedEmployees,
          role: "member"
        });

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
        queryClient.invalidateQueries({ queryKey: ["/api/company/teams"] });
        queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
        
        toast({ title: "Success", description: `Added ${selectedEmployees.length} members to ${selectedTeam.name}` });
        setIsAddMembersOpen(false);
        setSelectedEmployees([]);
        setSelectedManager("");
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to assign team members", variant: "destructive" });
      }
    }
  };

  // Generate unique username based on name
  const generateUsername = (firstName: string, lastName: string) => {
    if (!firstName || !lastName) return "";
    
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    const lastNamePart = lastName.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 999) + 1;
    
    return `${initials}${lastNamePart}${randomNum.toString().padStart(3, '0')}`;
  };

  // Auto-generate username when names change
  const handleNameChange = (field: string, value: string) => {
    const updatedManager = { ...newManager, [field]: value };
    
    if (field === 'firstName' || field === 'lastName') {
      updatedManager.username = generateUsername(
        field === 'firstName' ? value : newManager.firstName,
        field === 'lastName' ? value : newManager.lastName
      );
    }
    
    setNewManager(updatedManager);
  };

  const handleCreateManager = async () => {
    if (newManager.firstName && newManager.lastName && newManager.email && newManager.password && newManager.username) {
      try {
        console.log('Creating manager directly...');
        
        // Create manager with correct data format for the API
        const managerData = {
          managerId: newManager.username, // Use managerId field
          managerName: `${newManager.firstName} ${newManager.lastName}`,
          managerEmail: newManager.email,
          password: newManager.password,
          permissionLevel: "team_lead",
          branchId: null,
          teamId: null
        };
        
        const response = await apiRequest("POST", "/api/company/managers/create-standalone", managerData);
        console.log('Manager creation response:', response);
        
        // Refresh data to show new manager
        queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
        queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
        
        toast({ 
          title: "Manager Created Successfully!", 
          description: `${newManager.firstName} ${newManager.lastName} (${newManager.username}) has been created as a manager` 
        });
        
        setIsCreateManagerOpen(false);
        setNewManager({ firstName: "", lastName: "", email: "", password: "", username: "" });
      } catch (error: any) {
        console.error('Manager creation error:', error);
        toast({ 
          title: "Error", 
          description: error.message || "Failed to create manager account", 
          variant: "destructive" 
        });
      }
    }
  };

  const handleManageManager = (manager: any) => {
    setSelectedManagerForEdit(manager);
    setIsManageManagerOpen(true);
  };

  // Password reset mutation
  const resetManagerPasswordMutation = useMutation({
    mutationFn: async ({ managerId, newPassword }: { managerId: string; newPassword: string }) => {
      return apiRequest("POST", `/api/company/managers/${managerId}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      setShowPasswordDialog(false);
      setPasswordResetForm({ newPassword: "", confirmPassword: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
      toast({ 
        title: "Password Reset Successful", 
        description: "Manager password has been updated successfully" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to reset manager password", 
        variant: "destructive" 
      });
    }
  });

  const handleResetManagerPassword = () => {
    if (selectedManagerForEdit) {
      setShowPasswordDialog(true);
    }
  };

  const handleToggleManagerStatus = async () => {
    if (selectedManagerForEdit) {
      // Check if manager has a team assigned
      const managerTeam = teams?.find(team => team.teamManagerId === selectedManagerForEdit.id);
      const teamMembers = managerTeam ? employees?.filter(emp => emp.teamId === managerTeam.id) || [] : [];
      
      const currentStatus = selectedManagerForEdit.isActive ?? true;
      
      // If disabling and manager has team/members, show confirmation
      if (currentStatus && (managerTeam || teamMembers.length > 0)) {
        setShowToggleConfirmDialog(true);
        return;
      }
      
      // Direct toggle for managers without teams
      const newStatus = !currentStatus;
      toggleManagerStatusMutation.mutate({
        managerId: selectedManagerForEdit.id,
        isActive: newStatus
      });
    }
  };
  
  const handleConfirmToggleStatus = () => {
    if (selectedManagerForEdit) {
      const currentStatus = selectedManagerForEdit.isActive ?? true;
      const newStatus = !currentStatus;
      
      toggleManagerStatusMutation.mutate({
        managerId: selectedManagerForEdit.id,
        isActive: newStatus
      });
      setShowToggleConfirmDialog(false);
    }
  };

  if (employeesLoading || branchesLoading || teamsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CompanyNavHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CompanyNavHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Company Structure</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your company's organizational structure and employee assignments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Branches */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Branches
                  </CardTitle>
                  <CardDescription>Company locations</CardDescription>
                </div>
                <Button onClick={() => setIsCreateBranchOpen(true)} size="sm" className="shrink-0">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">Headquarters</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Main office</p>
                </div>
                {Array.isArray(branches) && branches.map((branch: any) => (
                  <div key={branch.id} className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{branch.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{branch.location}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Teams */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Teams
                  </CardTitle>
                  <CardDescription>Work groups</CardDescription>
                </div>
                <Button onClick={() => setIsCreateTeamOpen(true)} size="sm" className="shrink-0">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(teams) && teams.length > 0 ? teams.map((team: any) => (
                  <div key={team.id} className="p-3 bg-white rounded-lg border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="font-medium truncate">{team.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {team.branchId ? getBranchName(team.branchId) : "Headquarters"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManageTeam(team)}
                        className="flex items-center gap-1 shrink-0 w-full sm:w-auto"
                        data-testid={`manage-team-${team.id}`}
                      >
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Manage Team</span>
                        <span className="sm:hidden">Manage</span>
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No teams yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Managers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-blue-600" />
                    Managers
                  </CardTitle>
                  <CardDescription>Manager accounts and credentials</CardDescription>
                </div>
                <Button onClick={() => setIsCreateManagerOpen(true)} size="sm" className="shrink-0">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Show real managers from managers table */}
                {Array.isArray(managers) && managers.length > 0 ? (
                  managers.map((manager: any) => (
                      <div key={manager.id} className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="space-y-3">
                          {/* Header with Name, Status and Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <UserCog className="w-5 h-5 text-blue-600 shrink-0" />
                              <h4 className="font-semibold text-blue-900 truncate text-sm sm:text-base">{manager.managerName}</h4>
                              <div className={`w-2 h-2 rounded-full ${manager.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                            <Badge variant={manager.permissionLevel === "company_admin" ? "default" : "secondary"} className="shrink-0 text-xs">
                              <span className="hidden sm:inline">
                                {manager.permissionLevel === "company_admin" ? "Admin" : 
                                 manager.permissionLevel === "branch_manager" ? "Branch Manager" : "Team Lead"}
                              </span>
                              <span className="sm:hidden">
                                {manager.permissionLevel === "company_admin" ? "Admin" : 
                                 manager.permissionLevel === "branch_manager" ? "Branch" : "Team"}
                              </span>
                            </Badge>
                          </div>
                          
                          {/* Manager Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-blue-700">
                            <div className="truncate">
                              <span className="font-medium">Username:</span> {manager.uniqueId}
                            </div>
                            <div className="truncate">
                              <span className="font-medium">Status:</span> 
                              <span className={`ml-1 font-medium ${manager.isActive !== false ? 'text-green-700' : 'text-red-700'}`}>
                                {manager.isActive !== false ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                            <div className="truncate col-span-1 sm:col-span-2">
                              <span className="font-medium">Email:</span> {manager.managerEmail}
                            </div>
                            <div className="truncate col-span-1 sm:col-span-2">
                              <span className="font-medium">Team:</span> {getTeamName(manager.teamId) || 'No team assigned'}
                            </div>
                          </div>
                          
                          {/* Manage Button */}
                          <div className="flex justify-end pt-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-blue-600 px-3 py-1"
                              onClick={() => handleManageManager(manager)}
                              data-testid={`manage-manager-${manager.id}`}
                            >
                              <Shield className="w-4 h-4 mr-1" />
                              <span>Manage</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <UserCog className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No managers created yet</p>
                    <p className="text-xs">Create manager accounts to delegate work verification</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Employees
              </CardTitle>
              <CardDescription>Team members and their assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(employees) && employees.length > 0 ? employees.map((employee: any) => (
                  <div key={employee.id} className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        {getRoleIcon(employee.hierarchyRole)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium block truncate">{employee.firstName} {employee.lastName}</span>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          <div className="truncate">{getBranchName(employee.branchId)}</div>
                          <div className="truncate">{getTeamName(employee.teamId)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No employees yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Branch Dialog */}
      <Dialog open={isCreateBranchOpen} onOpenChange={setIsCreateBranchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
            <DialogDescription>Add a new branch office to your company</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="branch-name">Branch Name</Label>
              <Input
                id="branch-name"
                value={newBranch.name}
                onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                placeholder="e.g., Mumbai Branch"
                data-testid="input-branch-name"
              />
            </div>
            <div>
              <Label htmlFor="branch-location">Location</Label>
              <Input
                id="branch-location"
                value={newBranch.location}
                onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })}
                placeholder="e.g., Mumbai, Maharashtra"
                data-testid="input-branch-location"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleCreateBranch}
                disabled={createBranchMutation.isPending || !newBranch.name.trim() || !newBranch.location.trim()}
                className="flex-1 order-2 sm:order-1"
                data-testid="button-create-branch"
              >
                {createBranchMutation.isPending ? "Creating..." : "Create Branch"}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateBranchOpen(false)} className="order-1 sm:order-2">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>Add a new team to organize employees</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="e.g., Development Team"
                data-testid="input-team-name"
              />
            </div>
            <div>
              <Label htmlFor="team-branch">Branch</Label>
              <Select value={newTeam.branchId} onValueChange={(value) => setNewTeam({ ...newTeam, branchId: value })}>
                <SelectTrigger data-testid="select-team-branch">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="headquarters">Headquarters</SelectItem>
                  {Array.isArray(branches) && branches.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} - {branch.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="team-manager">Team Manager (Optional)</Label>
              <Select value={newTeam.teamManagerId} onValueChange={(value) => setNewTeam({ ...newTeam, teamManagerId: value })}>
                <SelectTrigger data-testid="select-team-manager">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {Array.isArray(managers) && managers
                    .filter((manager: any) => !manager.teamId) // Only show unassigned managers
                    .map((manager: any) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.managerName} ({manager.uniqueId})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleCreateTeam}
                disabled={createTeamMutation.isPending || !newTeam.name.trim() || !newTeam.branchId}
                className="flex-1 order-2 sm:order-1"
                data-testid="button-create-team"
              >
                {createTeamMutation.isPending ? "Creating..." : "Create Team"}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateTeamOpen(false)} className="order-1 sm:order-2">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Assignment Dialog */}
      <Dialog open={isAddMembersOpen} onOpenChange={setIsAddMembersOpen}>
        <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Add Members to {selectedTeam?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTeam?.teamManagerId ? 
                "Select employees to add to this team" : 
                "Select employees to add to this team and designate a manager"
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedTeam && (
            <div className="space-y-4">
              {/* Team Info */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-medium text-sm mb-2 text-green-900">Team: {selectedTeam.name}</h5>
                <p className="text-xs text-green-700">
                  Branch: {selectedTeam.branchId ? getBranchName(selectedTeam.branchId) : "Headquarters"}
                </p>
              </div>

              {/* Current Manager or Select Manager */}
              {selectedTeam?.teamManagerId ? (
                <div>
                  <Label>Current Team Manager</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">
                        {selectedTeam.teamManagerId ? 
                          managers?.find((m: any) => m.id === selectedTeam.teamManagerId)?.managerName || 'Manager Not Found' :
                          'No Manager Assigned'
                        }
                      </span>
                      {selectedTeam.teamManagerId && (
                        <span className="text-xs text-muted-foreground">
                          ({managers?.find((m: any) => m.id === selectedTeam.teamManagerId)?.uniqueId || 'N/A'})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedTeam.teamManagerId ? "This team already has a manager assigned" : "This team currently has no manager assigned"}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Label>Select Team Manager</Label>
                  <Select value={selectedManager} onValueChange={setSelectedManager}>
                    <SelectTrigger data-testid="select-manager">
                      <SelectValue placeholder="Choose team manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(managers) && managers
                        .filter((manager: any) => !manager.teamId) // Only show unassigned managers
                        .map((manager: any) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            <div className="flex items-center gap-2">
                              <UserCog className="w-4 h-4 text-blue-600" />
                              {manager.managerName} ({manager.uniqueId})
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Select Team Members */}
              <div>
                <Label>Select Team Members</Label>
                <div className="max-h-32 sm:max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {(() => {
                    // Get list of employee IDs already in this team
                    const currentTeamMemberIds = currentTeamMemberships?.map((membership: any) => membership.employeeId) || [];
                    
                    return Array.isArray(employees) && employees
                      .filter((emp: any) => emp.employeeId !== selectedManager) // Only exclude manager
                      .map((employee: any) => {
                        const isAlreadyInTeam = currentTeamMemberIds.includes(employee.employeeId);
                        const employeeTeamsList = allEmployeeTeams?.[employee.employeeId] || [];
                        const teamNames = employeeTeamsList.map((team: any) => team.name).join(', ');
                        
                        return (
                          <div key={employee.employeeId} className={`flex items-center space-x-2 ${isAlreadyInTeam ? 'opacity-60' : ''}`}>
                            <input
                              type="checkbox"
                              id={`emp-${employee.employeeId}`}
                              checked={selectedEmployees.includes(employee.employeeId)}
                              disabled={isAlreadyInTeam}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEmployees([...selectedEmployees, employee.employeeId]);
                                } else {
                                  setSelectedEmployees(selectedEmployees.filter(id => id !== employee.employeeId));
                                }
                              }}
                              className={`rounded ${isAlreadyInTeam ? 'cursor-not-allowed' : ''}`}
                            />
                            <label htmlFor={`emp-${employee.employeeId}`} className={`flex items-center gap-2 flex-1 min-w-0 ${isAlreadyInTeam ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                              <User className="w-4 h-4 text-gray-600 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="truncate block">{employee.firstName} {employee.lastName}</span>
                                <span className="text-xs text-muted-foreground truncate block">
                                  {employee.email}
                                  {employeeTeamsList.length > 0 && (
                                    <span className="ml-1 text-blue-600 font-medium">• Already in team {teamNames}</span>
                                  )}
                                </span>
                              </div>
                            </label>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>

              {/* Assignment Summary */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-medium text-sm mb-2 text-blue-900">Assignment Summary</h5>
                <div className="text-xs space-y-1 text-blue-800">
                  <div>Manager: {
                    selectedTeam?.teamManagerId ? 
                      (managers?.find((m: any) => m.id === selectedTeam.teamManagerId)?.managerName || 'Manager Not Found') + ' (' + (managers?.find((m: any) => m.id === selectedTeam.teamManagerId)?.uniqueId || 'N/A') + ')' + ' (Current)' :
                      selectedManager ? 
                        (managers?.find((m: any) => m.id === selectedManager)?.managerName || 'Manager Not Found') + ' (' + (managers?.find((m: any) => m.id === selectedManager)?.uniqueId || 'N/A') + ')' + ' (New)' : 
                        "No manager assigned"
                  }</div>
                  <div>Team Members: {selectedEmployees.length} selected</div>
                  <div>Total Team Size: {selectedEmployees.length + (selectedTeam?.teamManagerId || selectedManager ? 1 : 0)}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleSaveBulkAssignment}
                  disabled={(!selectedTeam?.teamManagerId && !selectedManager) || selectedEmployees.length === 0}
                  className="flex-1 order-2 sm:order-1"
                  data-testid="button-save-bulk-assignment"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Add {selectedEmployees.length + (selectedManager ? 1 : 0)} Members</span>
                    <span className="sm:hidden">Add ({selectedEmployees.length})</span>
                  </div>
                </Button>
                <Button variant="outline" onClick={() => setIsAddMembersOpen(false)} className="order-1 sm:order-2">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Team Dialog */}
      <Dialog open={isManageTeamOpen} onOpenChange={setIsManageTeamOpen}>
        <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Manage Team: {selectedTeam?.name}
            </DialogTitle>
            <DialogDescription>
              View and edit team members, roles, and structure
            </DialogDescription>
          </DialogHeader>
          
          {selectedTeam && (
            <div className="space-y-4">
              {/* Team Info */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-green-900">{selectedTeam.name}</h3>
                  <Badge variant="secondary">
                    {selectedTeam.branchId ? getBranchName(selectedTeam.branchId) : "Headquarters"}
                  </Badge>
                </div>
                <p className="text-sm text-green-700">
                  Team ID: {selectedTeam.id}
                </p>
              </div>

              {/* Current Team Members */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Current Team Members
                </h4>
                <div className="border rounded-lg">
                  {Array.isArray(manageTeamMemberships) && manageTeamMemberships.length > 0 ? (
                    <div className="divide-y">
                      {manageTeamMemberships.map((membership: any, index: number) => (
                        <div key={membership.employeeId} className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <User className="w-5 h-5 text-gray-600 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{membership.employee.firstName} {membership.employee.lastName}</p>
                              <p className="text-sm text-muted-foreground truncate">{membership.employee.email}</p>
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                              <span className="hidden sm:inline">{membership.role || 'Member'}</span>
                              <span className="sm:hidden">Member</span>
                            </Badge>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveFromTeam(membership.employeeId, selectedTeam.id)}
                              className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No team members assigned yet</p>
                      <p className="text-sm">Use "Add Members" to assign employees to this team</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Statistics */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {manageTeamMemberships?.length || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-700">Total</div>
                </div>
                <div className="p-2 sm:p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {manageTeamMemberships?.filter((membership: any) => membership.role === "lead" || membership.role === "manager").length || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-green-700">Managers</div>
                </div>
                <div className="p-2 sm:p-3 bg-purple-50 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">
                    {manageTeamMemberships?.filter((membership: any) => membership.role === "member").length || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-purple-700">Employees</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    setIsManageTeamOpen(false);
                    handleAddMembers(selectedTeam);
                  }}
                  className="flex-1 order-2 sm:order-1"
                  variant="outline"
                >
                  <UserPlus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add More Members</span>
                  <span className="sm:hidden">Add Members</span>
                </Button>
                <Button onClick={() => setIsManageTeamOpen(false)} variant="outline" className="order-1 sm:order-2">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Manager Dialog */}
      <Dialog open={isManageManagerOpen} onOpenChange={setIsManageManagerOpen}>
        <DialogContent className="max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Manage Manager: {selectedManagerForEdit?.managerName}
            </DialogTitle>
            <DialogDescription>
              Manage manager account, permissions, and credentials
            </DialogDescription>
          </DialogHeader>
          
          {selectedManagerForEdit && (
            <div className="space-y-4">
              {/* Manager Info */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-blue-900">Name:</span>
                    <p className="text-blue-700">{selectedManagerForEdit.managerName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Status:</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedManagerForEdit.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className={`text-xs font-medium ${selectedManagerForEdit.isActive !== false ? 'text-green-700' : 'text-red-700'}`}>
                        {selectedManagerForEdit.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 p-2 bg-white border border-blue-300 rounded">
                    <span className="font-medium text-blue-900">Manager ID (Login Username):</span>
                    <p className="text-blue-900 font-mono font-bold text-lg">{selectedManagerForEdit.uniqueId}</p>
                    <p className="text-xs text-blue-600 mt-1">💡 Share this ID with the manager for login access</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Role:</span>
                    <p className="text-blue-700">{selectedManagerForEdit.permissionLevel?.replace('_', ' ') || 'Manager'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Email:</span>
                    <p className="text-blue-700">{selectedManagerForEdit.managerEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-blue-900">Team:</span>
                    <p className="text-blue-700">{getTeamName(selectedManagerForEdit.teamId) || 'No Team'}</p>
                  </div>
                </div>
              </div>

              {/* Manager Actions */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={handleResetManagerPassword}
                    variant="outline"
                    className="flex-1"
                    data-testid="reset-manager-password"
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                  <Button
                    onClick={handleToggleManagerStatus}
                    variant={selectedManagerForEdit.isActive !== false ? "destructive" : "default"}
                    className="flex-1"
                    disabled={toggleManagerStatusMutation.isPending}
                    data-testid="toggle-manager-status"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {toggleManagerStatusMutation.isPending ? "Updating..." : 
                     selectedManagerForEdit.isActive !== false ? "Disable Manager" : "Enable Manager"}
                  </Button>
                </div>
              </div>

              {/* Manager Permissions */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-medium text-sm mb-2 text-green-900">Current Permissions</h5>
                <div className="text-xs space-y-1 text-green-700">
                  <div>✓ Can verify work entries</div>
                  <div>✓ Can manage team members</div>
                  {selectedManagerForEdit.permissionLevel === "branch_manager" && <div>✓ Can manage entire branch</div>}
                  {selectedManagerForEdit.permissionLevel === "company_admin" && <div>✓ Full company access</div>}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setIsManageManagerOpen(false)} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={(open) => {
        setShowPasswordDialog(open);
        if (!open) {
          setPasswordResetForm({ newPassword: "", confirmPassword: "" });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-blue-600" />
              Reset Manager Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for {selectedManagerForEdit?.managerName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <Label className="text-sm font-medium text-gray-700">Manager Details</Label>
              <div className="mt-2 space-y-1 text-sm">
                <div><strong>Name:</strong> {selectedManagerForEdit?.managerName}</div>
                <div><strong>ID:</strong> {selectedManagerForEdit?.uniqueId}</div>
                <div><strong>Email:</strong> {selectedManagerForEdit?.managerEmail}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="new-password" className="text-sm font-medium">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordResetForm.newPassword}
                  onChange={(e) => setPasswordResetForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  className="mt-1"
                  data-testid="input-new-password"
                />
              </div>
              
              <div>
                <Label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordResetForm.confirmPassword}
                  onChange={(e) => setPasswordResetForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  className="mt-1"
                  data-testid="input-confirm-password"
                />
                {passwordResetForm.confirmPassword && passwordResetForm.newPassword !== passwordResetForm.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <div className="text-sm text-blue-800">
                  <strong>Password Requirements:</strong>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Minimum 8 characters</li>
                    <li>• At least one uppercase letter</li>
                    <li>• At least one number</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordResetForm({ newPassword: "", confirmPassword: "" });
              }}
              className="flex-1"
              data-testid="button-cancel-reset"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!passwordResetForm.newPassword || !passwordResetForm.confirmPassword) {
                  toast({ title: "Error", description: "Please fill in both password fields", variant: "destructive" });
                  return;
                }
                if (passwordResetForm.newPassword !== passwordResetForm.confirmPassword) {
                  toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
                  return;
                }
                if (passwordResetForm.newPassword.length < 8) {
                  toast({ title: "Error", description: "Password must be at least 8 characters long", variant: "destructive" });
                  return;
                }
                resetManagerPasswordMutation.mutate({ 
                  managerId: selectedManagerForEdit?.id, 
                  newPassword: passwordResetForm.newPassword 
                });
              }}
              disabled={resetManagerPasswordMutation.isPending || !passwordResetForm.newPassword || !passwordResetForm.confirmPassword || passwordResetForm.newPassword !== passwordResetForm.confirmPassword}
              className="flex-1"
              data-testid="button-confirm-reset"
            >
              {resetManagerPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Manager Dialog */}
      <Dialog open={isCreateManagerOpen} onOpenChange={setIsCreateManagerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-blue-600" />
              Create Manager
            </DialogTitle>
            <DialogDescription>
              Create a new manager with unique credentials
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="manager-first-name">First Name</Label>
                <Input
                  id="manager-first-name"
                  value={newManager.firstName}
                  onChange={(e) => handleNameChange('firstName', e.target.value)}
                  placeholder="John"
                  data-testid="input-manager-first-name"
                />
              </div>
              <div>
                <Label htmlFor="manager-last-name">Last Name</Label>
                <Input
                  id="manager-last-name"
                  value={newManager.lastName}
                  onChange={(e) => handleNameChange('lastName', e.target.value)}
                  placeholder="Doe"
                  data-testid="input-manager-last-name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="manager-username">Manager Username (Auto-generated)</Label>
              <Input
                id="manager-username"
                value={newManager.username}
                readOnly
                className="bg-gray-50 font-mono text-sm"
                placeholder="Username will be generated automatically"
                data-testid="input-manager-username"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Unique username generated from name (e.g., JOHDO123)
              </p>
            </div>
            
            <div>
              <Label htmlFor="manager-email">Email (for notifications)</Label>
              <Input
                id="manager-email"
                type="email"
                value={newManager.email}
                onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                placeholder="john.doe@company.com"
                data-testid="input-manager-email"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email for notifications and communication only
              </p>
            </div>
            
            <div>
              <Label htmlFor="manager-password">Password</Label>
              <Input
                id="manager-password"
                type="password"
                value={newManager.password}
                onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                placeholder="Secure password"
                data-testid="input-manager-password"
              />
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-sm mb-2 text-blue-900">Manager Credentials</h5>
              <div className="text-xs space-y-1 text-blue-800">
                <div>Username: {newManager.username || "Will be generated automatically"}</div>
                <div>Role: Team Manager</div>
                <div>Permissions: Can verify work entries, manage team members</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateManager}
                disabled={!newManager.firstName || !newManager.lastName || !newManager.email || !newManager.password}
                className="flex-1"
                data-testid="button-create-manager"
              >
                <div className="flex items-center gap-2">
                  <UserCog className="w-4 h-4" />
                  Create Manager
                </div>
              </Button>
              <Button variant="outline" onClick={() => setIsCreateManagerOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Confirmation Dialog */}
      <Dialog open={showToggleConfirmDialog} onOpenChange={setShowToggleConfirmDialog}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Shield className="w-5 h-5" />
              Confirm Manager Disable
            </DialogTitle>
            <DialogDescription>
              This action will have significant impact on the team structure
            </DialogDescription>
          </DialogHeader>
          
          {selectedManagerForEdit && (
            <div className="space-y-4">
              {/* Manager Info */}
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-900">
                  Disabling: {selectedManagerForEdit.managerName}
                </p>
                <p className="text-sm text-orange-700">
                  Role: {selectedManagerForEdit.permissionLevel?.replace('_', ' ') || 'Manager'}
                </p>
              </div>

              {/* Impact Preview */}
              <div className="space-y-3">
                <h4 className="font-medium text-red-900">Impact of this action:</h4>
                
                {(() => {
                  const managerTeam = teams?.find(team => team.teamManagerId === selectedManagerForEdit.id);
                  const teamMembers = managerTeam ? employees?.filter(emp => emp.teamId === managerTeam.id) || [] : [];
                  
                  return (
                    <>
                      {managerTeam && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="text-sm text-red-900 space-y-1">
                            <div className="font-medium">• Team "{managerTeam.name}" will lose its manager</div>
                            <div>• {teamMembers.length} team members will be unassigned from manager supervision</div>
                            <div>• Team structure will need manual reassignment</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-sm text-red-900 space-y-1">
                          <div className="font-medium">• Manager login access will be disabled</div>
                          <div>• All manager permissions will be suspended</div>
                          <div>• Work verification capability will be removed</div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Warning */}
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You can re-enable this manager later, but team assignments will need to be manually restored.
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={handleConfirmToggleStatus}
                  variant="destructive"
                  className="flex-1"
                  disabled={toggleManagerStatusMutation.isPending}
                >
                  {toggleManagerStatusMutation.isPending ? "Disabling..." : "Yes, Disable Manager"}
                </Button>
                <Button 
                  onClick={() => setShowToggleConfirmDialog(false)} 
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}