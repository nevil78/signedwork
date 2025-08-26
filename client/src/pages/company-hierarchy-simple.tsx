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
  Edit,
  Crown,
  Shield,
  CheckCircle,
  Target
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import CompanyNavHeader from "@/components/company-nav-header";

export default function CompanyHierarchySimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog states
  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAssignEmployeeOpen, setIsAssignEmployeeOpen] = useState(false);
  
  // Selected data
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  // Form states
  const [newBranch, setNewBranch] = useState({ name: "", location: "" });
  const [newTeam, setNewTeam] = useState({ name: "", branchId: "" });
  const [employeeAssignment, setEmployeeAssignment] = useState({
    branchId: "",
    teamId: "",
    hierarchyRole: "employee"
  });

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

  const handleAssignEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setEmployeeAssignment({
      branchId: employee.branchId || "",
      teamId: employee.teamId || "",
      hierarchyRole: employee.hierarchyRole || "employee"
    });
    setIsAssignEmployeeOpen(true);
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

  const handleSaveAssignment = () => {
    if (selectedEmployee) {
      assignEmployeeMutation.mutate({
        employeeId: selectedEmployee.employeeId,
        assignment: {
          ...employeeAssignment,
          branchId: employeeAssignment.branchId === "headquarters" ? null : employeeAssignment.branchId,
          teamId: employeeAssignment.teamId === "no_team" ? null : employeeAssignment.teamId || null
        }
      });
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
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{team.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {team.branchId ? getBranchName(team.branchId) : "Headquarters"}
                    </p>
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAssignEmployee(employee)}
                        data-testid={`assign-employee-${employee.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Assign
                      </Button>
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
      <Dialog open={isAssignEmployeeOpen} onOpenChange={setIsAssignEmployeeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Assign Employee
            </DialogTitle>
            <DialogDescription>
              Set branch, team, and role for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-4">
              {/* Current Assignment Display */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-sm mb-2">Current Assignment</h5>
                <div className="text-xs space-y-1">
                  <div>Branch: {getBranchName(selectedEmployee.branchId)}</div>
                  <div>Team: {getTeamName(selectedEmployee.teamId)}</div>
                  <div>Role: {selectedEmployee.hierarchyRole?.replace('_', ' ') || 'employee'}</div>
                </div>
              </div>

              {/* Assignment Form */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="assign-branch">Branch</Label>
                  <Select 
                    value={employeeAssignment.branchId} 
                    onValueChange={(value) => setEmployeeAssignment({ 
                      ...employeeAssignment, 
                      branchId: value, 
                      teamId: value === "headquarters" ? "" : employeeAssignment.teamId 
                    })}
                  >
                    <SelectTrigger data-testid="select-assign-branch">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="headquarters">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-yellow-600" />
                          Headquarters
                        </div>
                      </SelectItem>
                      {Array.isArray(branches) && branches.map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            {branch.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assign-team">Team</Label>
                  <Select 
                    value={employeeAssignment.teamId} 
                    onValueChange={(value) => setEmployeeAssignment({ ...employeeAssignment, teamId: value })}
                    disabled={!employeeAssignment.branchId || employeeAssignment.branchId === "headquarters"}
                  >
                    <SelectTrigger data-testid="select-assign-team">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_team">No Team</SelectItem>
                      {Array.isArray(teams) && teams
                        .filter((team: any) => 
                          employeeAssignment.branchId === "headquarters" 
                            ? !team.branchId 
                            : team.branchId === employeeAssignment.branchId
                        )
                        .map((team: any) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-green-600" />
                              {team.name}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assign-role">Role</Label>
                  <Select 
                    value={employeeAssignment.hierarchyRole} 
                    onValueChange={(value) => setEmployeeAssignment({ ...employeeAssignment, hierarchyRole: value })}
                  >
                    <SelectTrigger data-testid="select-assign-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-600" />
                          Employee
                        </div>
                      </SelectItem>
                      <SelectItem value="team_lead">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          Team Lead
                        </div>
                      </SelectItem>
                      <SelectItem value="branch_manager">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          Branch Manager
                        </div>
                      </SelectItem>
                      <SelectItem value="company_admin">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-purple-600" />
                          Company Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assignment Summary */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-medium text-sm mb-2 text-blue-900">New Assignment</h5>
                <div className="text-xs space-y-1 text-blue-800">
                  <div>Branch: {employeeAssignment.branchId === "headquarters" ? "Headquarters" : getBranchName(employeeAssignment.branchId) || "Not selected"}</div>
                  <div>Team: {getTeamName(employeeAssignment.teamId) || "No team"}</div>
                  <div>Role: {employeeAssignment.hierarchyRole.replace('_', ' ')}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveAssignment}
                  disabled={assignEmployeeMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-assignment"
                >
                  {assignEmployeeMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Save Assignment
                    </div>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsAssignEmployeeOpen(false)}>
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