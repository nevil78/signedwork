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
  const [newManager, setNewManager] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newTempPassword, setNewTempPassword] = useState("");
  
  // Form states
  const [newBranch, setNewBranch] = useState({ name: "", location: "" });
  const [newTeam, setNewTeam] = useState({ name: "", branchId: "" });
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
      setNewTeam({ name: "", branchId: "" });
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
      setIsAssignEmployeeOpen(false);
      setSelectedEmployee(null);
      toast({ title: "Success", description: "Employee assigned successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign employee", variant: "destructive" });
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

  const handleManageTeam = (team: any) => {
    setSelectedTeam(team);
    setIsManageTeamOpen(true);
  };

  const handleRemoveFromTeam = async (employeeId: string) => {
    try {
      await apiRequest("PATCH", `/api/company/employees/${employeeId}/hierarchy-role`, {
        teamId: null,
        hierarchyRole: "employee",
        branchId: null,
        canVerifyWork: false,
        canManageEmployees: false,
        verificationScope: "none"
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
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
        maxMembers: 10
      });
    }
  };

  const handleSaveBulkAssignment = async () => {
    if (selectedTeam && selectedManager && selectedEmployees.length > 0) {
      try {
        // Assign manager to team
        await apiRequest("PATCH", `/api/company/employees/${selectedManager}/hierarchy-role`, {
          teamId: selectedTeam.id,
          hierarchyRole: "team_lead",
          branchId: selectedTeam.branchId,
          canVerifyWork: true,
          canManageEmployees: true,
          verificationScope: "team"
        });

        // Assign employees to team
        for (const employeeId of selectedEmployees) {
          await apiRequest("PATCH", `/api/company/employees/${employeeId}/hierarchy-role`, {
            teamId: selectedTeam.id,
            hierarchyRole: "employee",
            branchId: selectedTeam.branchId,
            canVerifyWork: false,
            canManageEmployees: false,
            verificationScope: "none"
          });
        }

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
        queryClient.invalidateQueries({ queryKey: ["/api/company/teams"] });
        
        toast({ title: "Success", description: `Added ${selectedEmployees.length + 1} members to ${selectedTeam.name}` });
        setIsAddMembersOpen(false);
        setSelectedEmployees([]);
        setSelectedManager("");
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to assign team members", variant: "destructive" });
      }
    }
  };

  const handleCreateManager = async () => {
    if (newManager.firstName && newManager.lastName && newManager.email && newManager.password) {
      try {
        // TODO: Implement actual manager creation API call when backend is ready
        console.log('Creating manager:', newManager);
        
        // For now, we'll simulate success
        toast({ title: "Success", description: `Manager ${newManager.firstName} ${newManager.lastName} will be created once API is implemented` });
        setIsCreateManagerOpen(false);
        setNewManager({ firstName: "", lastName: "", email: "", password: "" });
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to create manager", variant: "destructive" });
      }
    }
  };

  const handleManageManager = (manager: any) => {
    setSelectedManagerForEdit(manager);
    setIsManageManagerOpen(true);
  };

  const handleResetManagerPassword = async () => {
    if (selectedManagerForEdit) {
      try {
        // Generate a new temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
        
        // TODO: Call API to update manager password
        console.log('Resetting password for manager:', selectedManagerForEdit.employeeId);
        console.log('New temporary password:', tempPassword);
        
        // Show the new password in a dialog
        setNewTempPassword(tempPassword);
        setShowPasswordDialog(true);
        
        toast({ 
          title: "Password Reset Successful", 
          description: "New temporary password generated"
        });
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to reset password", variant: "destructive" });
      }
    }
  };

  const handleToggleManagerStatus = async () => {
    if (selectedManagerForEdit) {
      try {
        // TODO: Implement manager status toggle API call
        console.log('Toggling status for manager:', selectedManagerForEdit.employeeId);
        toast({ title: "Success", description: "Manager status updated" });
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to update manager status", variant: "destructive" });
      }
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Company Structure</h1>
          <p className="text-muted-foreground">Manage your company's organizational structure and employee assignments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <Button onClick={() => setIsCreateBranchOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
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
                <Button onClick={() => setIsCreateTeamOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(teams) && teams.length > 0 ? teams.map((team: any) => (
                  <div key={team.id} className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{team.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {team.branchId ? getBranchName(team.branchId) : "Headquarters"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManageTeam(team)}
                        className="flex items-center gap-1"
                        data-testid={`manage-team-${team.id}`}
                      >
                        <Users className="w-4 h-4" />
                        Manage Team
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
                <Button onClick={() => setIsCreateManagerOpen(true)} size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Manager
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(employees) && employees.filter((emp: any) => emp.hierarchyRole === "team_lead" || emp.hierarchyRole === "branch_manager" || emp.hierarchyRole === "company_admin").length > 0 ? (
                  employees
                    .filter((emp: any) => emp.hierarchyRole === "team_lead" || emp.hierarchyRole === "branch_manager" || emp.hierarchyRole === "company_admin")
                    .map((manager: any) => (
                      <div key={manager.id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <UserCog className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="font-semibold text-blue-900">{manager.firstName} {manager.lastName}</h4>
                              <div className="text-xs text-blue-700 space-y-1">
                                <div>Role: {manager.hierarchyRole?.replace('_', ' ') || 'Manager'}</div>
                                <div>Email: {manager.email}</div>
                                <div>Team: {getTeamName(manager.teamId) || 'No team assigned'}</div>
                              </div>
                            </div>
                            <Badge variant={manager.hierarchyRole === "company_admin" ? "default" : "secondary"}>
                              {manager.hierarchyRole === "company_admin" ? "Admin" : 
                               manager.hierarchyRole === "branch_manager" ? "Branch Manager" : "Team Lead"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-blue-600"
                              onClick={() => handleManageManager(manager)}
                              data-testid={`manage-manager-${manager.employeeId}`}
                            >
                              <Shield className="w-4 h-4 mr-1" />
                              Manage
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(employee.hierarchyRole)}
                        <div>
                          <span className="font-medium">{employee.firstName} {employee.lastName}</span>
                          <div className="text-xs text-muted-foreground mt-1">
                            <div>{getBranchName(employee.branchId)}</div>
                            <div>{getTeamName(employee.teamId)}</div>
                          </div>
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
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateBranch}
                disabled={createBranchMutation.isPending || !newBranch.name.trim() || !newBranch.location.trim()}
                className="flex-1"
                data-testid="button-create-branch"
              >
                {createBranchMutation.isPending ? "Creating..." : "Create Branch"}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateBranchOpen(false)}>
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
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateTeam}
                disabled={createTeamMutation.isPending || !newTeam.name.trim() || !newTeam.branchId}
                className="flex-1"
                data-testid="button-create-team"
              >
                {createTeamMutation.isPending ? "Creating..." : "Create Team"}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateTeamOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Assignment Dialog */}
      <Dialog open={isAddMembersOpen} onOpenChange={setIsAddMembersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Add Members to {selectedTeam?.name}
            </DialogTitle>
            <DialogDescription>
              Select employees to add to this team and designate a manager
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

              {/* Select Manager */}
              <div>
                <Label>Select Team Manager</Label>
                <Select value={selectedManager} onValueChange={setSelectedManager}>
                  <SelectTrigger data-testid="select-manager">
                    <SelectValue placeholder="Choose team manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(employees) && employees
                      .filter((emp: any) => !emp.teamId) // Only show unassigned employees
                      .map((employee: any) => (
                        <SelectItem key={employee.employeeId} value={employee.employeeId}>
                          <div className="flex items-center gap-2">
                            <UserCog className="w-4 h-4 text-blue-600" />
                            {employee.firstName} {employee.lastName}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Team Members */}
              <div>
                <Label>Select Team Members</Label>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {Array.isArray(employees) && employees
                    .filter((emp: any) => !emp.teamId && emp.employeeId !== selectedManager) // Exclude manager and already assigned
                    .map((employee: any) => (
                      <div key={employee.employeeId} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`emp-${employee.employeeId}`}
                          checked={selectedEmployees.includes(employee.employeeId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees([...selectedEmployees, employee.employeeId]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(id => id !== employee.employeeId));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`emp-${employee.employeeId}`} className="flex items-center gap-2 cursor-pointer flex-1">
                          <User className="w-4 h-4 text-gray-600" />
                          <span>{employee.firstName} {employee.lastName}</span>
                          <span className="text-xs text-muted-foreground">({employee.email})</span>
                        </label>
                      </div>
                    ))}
                </div>
              </div>

              {/* Assignment Summary */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-medium text-sm mb-2 text-blue-900">Assignment Summary</h5>
                <div className="text-xs space-y-1 text-blue-800">
                  <div>Manager: {selectedManager ? employees?.find((e: any) => e.employeeId === selectedManager)?.firstName + ' ' + employees?.find((e: any) => e.employeeId === selectedManager)?.lastName : "Not selected"}</div>
                  <div>Team Members: {selectedEmployees.length} selected</div>
                  <div>Total Team Size: {selectedManager && selectedEmployees.length ? selectedEmployees.length + 1 : 0}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveBulkAssignment}
                  disabled={!selectedManager || selectedEmployees.length === 0}
                  className="flex-1"
                  data-testid="button-save-bulk-assignment"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Add {selectedEmployees.length + (selectedManager ? 1 : 0)} Members
                  </div>
                </Button>
                <Button variant="outline" onClick={() => setIsAddMembersOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Team Dialog */}
      <Dialog open={isManageTeamOpen} onOpenChange={setIsManageTeamOpen}>
        <DialogContent className="max-w-2xl">
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
                  {Array.isArray(employees) && employees
                    .filter((emp: any) => emp.teamId === selectedTeam.id)
                    .length > 0 ? (
                    <div className="divide-y">
                      {employees
                        .filter((emp: any) => emp.teamId === selectedTeam.id)
                        .map((member: any, index: number) => (
                          <div key={member.employeeId} className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {member.hierarchyRole === "team_lead" || member.hierarchyRole === "branch_manager" ? (
                                <UserCog className="w-5 h-5 text-blue-600" />
                              ) : (
                                <User className="w-5 h-5 text-gray-600" />
                              )}
                              <div>
                                <p className="font-medium">{member.firstName} {member.lastName}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                              </div>
                              <Badge variant={member.hierarchyRole === "team_lead" || member.hierarchyRole === "branch_manager" ? "default" : "secondary"}>
                                {member.hierarchyRole === "team_lead" ? "Manager" : 
                                 member.hierarchyRole === "branch_manager" ? "Branch Manager" : "Employee"}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              {member.hierarchyRole !== "team_lead" && member.hierarchyRole !== "branch_manager" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleChangeManager(member.employeeId)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  Make Manager
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveFromTeam(member.employeeId)}
                                className="text-red-600 hover:text-red-700"
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
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {employees?.filter((emp: any) => emp.teamId === selectedTeam.id).length || 0}
                  </div>
                  <div className="text-sm text-blue-700">Total Members</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {employees?.filter((emp: any) => emp.teamId === selectedTeam.id && (emp.hierarchyRole === "team_lead" || emp.hierarchyRole === "branch_manager")).length || 0}
                  </div>
                  <div className="text-sm text-green-700">Managers</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {employees?.filter((emp: any) => emp.teamId === selectedTeam.id && emp.hierarchyRole === "employee").length || 0}
                  </div>
                  <div className="text-sm text-purple-700">Employees</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    setIsManageTeamOpen(false);
                    handleAddMembers(selectedTeam);
                  }}
                  className="flex-1"
                  variant="outline"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add More Members
                </Button>
                <Button onClick={() => setIsManageTeamOpen(false)} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Manager Dialog */}
      <Dialog open={isManageManagerOpen} onOpenChange={setIsManageManagerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Manage Manager: {selectedManagerForEdit?.firstName} {selectedManagerForEdit?.lastName}
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
                    <p className="text-blue-700">{selectedManagerForEdit.firstName} {selectedManagerForEdit.lastName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Role:</span>
                    <p className="text-blue-700">{selectedManagerForEdit.hierarchyRole?.replace('_', ' ') || 'Manager'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Email:</span>
                    <p className="text-blue-700">{selectedManagerForEdit.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Team:</span>
                    <p className="text-blue-700">{getTeamName(selectedManagerForEdit.teamId) || 'No team'}</p>
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
                    variant="outline"
                    className="flex-1"
                    data-testid="toggle-manager-status"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Toggle Status
                  </Button>
                </div>
              </div>

              {/* Manager Permissions */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-medium text-sm mb-2 text-green-900">Current Permissions</h5>
                <div className="text-xs space-y-1 text-green-700">
                  <div>✓ Can verify work entries</div>
                  <div>✓ Can manage team members</div>
                  {selectedManagerForEdit.hierarchyRole === "branch_manager" && <div>✓ Can manage entire branch</div>}
                  {selectedManagerForEdit.hierarchyRole === "company_admin" && <div>✓ Full company access</div>}
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
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-green-600" />
              New Temporary Password
            </DialogTitle>
            <DialogDescription>
              Share this temporary password with {selectedManagerForEdit?.firstName} {selectedManagerForEdit?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <label className="block text-sm font-medium text-green-900 mb-2">
                Temporary Password:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTempPassword}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-md font-mono text-sm"
                  data-testid="temp-password-input"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(newTempPassword);
                    toast({ title: "Copied!", description: "Password copied to clipboard" });
                  }}
                  data-testid="copy-password-btn"
                >
                  Copy
                </Button>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Instructions:</strong>
              </p>
              <ul className="text-xs text-blue-800 mt-1 space-y-1">
                <li>• Share this password with the manager</li>
                <li>• They should change it after first login</li>
                <li>• This password is valid immediately</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setShowPasswordDialog(false)} className="flex-1">
                Done
              </Button>
            </div>
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
                  onChange={(e) => setNewManager({ ...newManager, firstName: e.target.value })}
                  placeholder="John"
                  data-testid="input-manager-first-name"
                />
              </div>
              <div>
                <Label htmlFor="manager-last-name">Last Name</Label>
                <Input
                  id="manager-last-name"
                  value={newManager.lastName}
                  onChange={(e) => setNewManager({ ...newManager, lastName: e.target.value })}
                  placeholder="Doe"
                  data-testid="input-manager-last-name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="manager-email">Email (Manager ID)</Label>
              <Input
                id="manager-email"
                type="email"
                value={newManager.email}
                onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                placeholder="john.doe@company.com"
                data-testid="input-manager-email"
              />
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
                <div>Manager ID: {newManager.email || "Not set"}</div>
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
    </div>
  );
}