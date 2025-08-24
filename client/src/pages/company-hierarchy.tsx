import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Users, 
  UserCheck, 
  Plus, 
  Settings, 
  ChevronRight, 
  Crown, 
  Shield, 
  User,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function CompanyHierarchy() {
  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isManageEmployeeOpen, setIsManageEmployeeOpen] = useState(false);
  const [isEditBranchOpen, setIsEditBranchOpen] = useState(false);
  const [isDeleteBranchOpen, setIsDeleteBranchOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [isDeleteTeamOpen, setIsDeleteTeamOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterVerification, setFilterVerification] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  
  const [newBranch, setNewBranch] = useState({
    name: "",
    location: "",
    description: "",
    managerEmployeeId: ""
  });
  const [editBranch, setEditBranch] = useState({
    name: "",
    location: "",
    description: "",
    managerEmployeeId: "",
    isActive: true
  });
  const [editTeam, setEditTeam] = useState({
    name: "",
    description: "",
    branchId: "",
    teamLeadEmployeeId: "",
    maxMembers: 10,
    isActive: true
  });
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    branchId: "",
    teamLeadEmployeeId: "",
    maxMembers: 10
  });
  const [employeeUpdate, setEmployeeUpdate] = useState({
    hierarchyRole: "",
    branchId: "",
    teamId: "",
    canVerifyWork: false,
    canManageEmployees: false,
    canCreateTeams: false,
    verificationScope: "none"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: structure, isLoading: structureLoading } = useQuery({
    queryKey: ["/api/company/structure"],
  });

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ["/api/company/branches"],
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/company/teams"],
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/company/employees"],
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Mutations
  const createBranchMutation = useMutation({
    mutationFn: async (branchData: any) => {
      return apiRequest("/api/company/branches", "POST", branchData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      setIsCreateBranchOpen(false);
      setNewBranch({ name: "", location: "", description: "", managerEmployeeId: "" });
      toast({ title: "Success", description: "Branch created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create branch", variant: "destructive" });
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      return apiRequest("/api/company/teams", "POST", teamData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      setIsCreateTeamOpen(false);
      setNewTeam({ name: "", description: "", branchId: "", teamLeadEmployeeId: "", maxMembers: 10 });
      toast({ title: "Success", description: "Team created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create team", variant: "destructive" });
    }
  });

  const updateEmployeeHierarchyMutation = useMutation({
    mutationFn: async ({ employeeId, updates }: { employeeId: string; updates: any }) => {
      return apiRequest(`/api/company/employees/${employeeId}/hierarchy-role`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      setIsManageEmployeeOpen(false);
      setSelectedEmployee(null);
      toast({ title: "Success", description: "Employee hierarchy updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update employee hierarchy", variant: "destructive" });
    }
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({ branchId, updates }: { branchId: string; updates: any }) => {
      return apiRequest(`/api/company/branches/${branchId}`, "PUT", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      setIsEditBranchOpen(false);
      setSelectedBranch(null);
      toast({ title: "Success", description: "Branch updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update branch", variant: "destructive" });
    }
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (branchId: string) => {
      return apiRequest(`/api/company/branches/${branchId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      setIsDeleteBranchOpen(false);
      setSelectedBranch(null);
      toast({ title: "Success", description: "Branch deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete branch", variant: "destructive" });
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, updates }: { teamId: string; updates: any }) => {
      return apiRequest(`/api/company/teams/${teamId}`, "PUT", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      setIsEditTeamOpen(false);
      setSelectedTeam(null);
      toast({ title: "Success", description: "Team updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update team", variant: "destructive" });
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return apiRequest(`/api/company/teams/${teamId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      setIsDeleteTeamOpen(false);
      setSelectedTeam(null);
      toast({ title: "Success", description: "Team deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete team", variant: "destructive" });
    }
  });

  // Handle employee selection for hierarchy management
  const handleManageEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setEmployeeUpdate({
      hierarchyRole: employee.hierarchyRole || "employee",
      branchId: employee.branchId || "",
      teamId: employee.teamId || "",
      canVerifyWork: employee.canVerifyWork || false,
      canManageEmployees: employee.canManageEmployees || false,
      canCreateTeams: employee.canCreateTeams || false,
      verificationScope: employee.verificationScope || "none"
    });
    setIsManageEmployeeOpen(true);
  };

  // Handle branch edit
  const handleEditBranch = (branch: any) => {
    setSelectedBranch(branch);
    setEditBranch({
      name: branch.name || "",
      location: branch.location || "",
      description: branch.description || "",
      managerEmployeeId: branch.managerEmployeeId || "",
      isActive: branch.isActive !== false
    });
    setIsEditBranchOpen(true);
  };

  // Handle branch delete confirmation
  const handleDeleteBranch = (branch: any) => {
    setSelectedBranch(branch);
    setIsDeleteBranchOpen(true);
  };

  // Handle team edit
  const handleEditTeam = (team: any) => {
    setSelectedTeam(team);
    setEditTeam({
      name: team.name || "",
      description: team.description || "",
      branchId: team.branchId || "",
      teamLeadEmployeeId: team.teamLeadEmployeeId || "",
      maxMembers: team.maxMembers || 10,
      isActive: team.isActive !== false
    });
    setIsEditTeamOpen(true);
  };

  // Handle team delete confirmation
  const handleDeleteTeam = (team: any) => {
    setSelectedTeam(team);
    setIsDeleteTeamOpen(true);
  };

  // Permission system
  const getCurrentUserEmployee = () => {
    if (!currentUser || !Array.isArray(employees)) return null;
    return employees.find((emp: any) => emp.employee?.email === currentUser.email);
  };

  const canManageBranches = () => {
    const userEmployee = getCurrentUserEmployee();
    if (!userEmployee) return false;
    return userEmployee.hierarchyRole === 'company_admin' || userEmployee.canManageEmployees;
  };

  const canManageTeams = () => {
    const userEmployee = getCurrentUserEmployee();
    if (!userEmployee) return false;
    return userEmployee.hierarchyRole === 'company_admin' || 
           userEmployee.hierarchyRole === 'branch_manager' || 
           userEmployee.canCreateTeams;
  };

  const canManageEmployee = (targetEmployee: any) => {
    const userEmployee = getCurrentUserEmployee();
    if (!userEmployee || !targetEmployee) return false;
    
    // Company admin can manage everyone
    if (userEmployee.hierarchyRole === 'company_admin') return true;
    
    // Branch manager can manage employees in their branch
    if (userEmployee.hierarchyRole === 'branch_manager' && userEmployee.branchId === targetEmployee.branchId) return true;
    
    // Team lead can manage employees in their team
    if (userEmployee.hierarchyRole === 'team_lead' && userEmployee.teamId === targetEmployee.teamId) return true;
    
    return false;
  };

  const canEditBranch = (branch: any) => {
    const userEmployee = getCurrentUserEmployee();
    if (!userEmployee) return false;
    
    // Company admin can edit all branches
    if (userEmployee.hierarchyRole === 'company_admin') return true;
    
    // Branch manager can only edit their own branch
    if (userEmployee.hierarchyRole === 'branch_manager' && userEmployee.branchId === branch.id) return true;
    
    return false;
  };

  const canEditTeam = (team: any) => {
    const userEmployee = getCurrentUserEmployee();
    if (!userEmployee) return false;
    
    // Company admin can edit all teams
    if (userEmployee.hierarchyRole === 'company_admin') return true;
    
    // Branch manager can edit teams in their branch
    if (userEmployee.hierarchyRole === 'branch_manager' && userEmployee.branchId === team.branchId) return true;
    
    // Team lead can edit their own team
    if (userEmployee.hierarchyRole === 'team_lead' && userEmployee.teamId === team.id) return true;
    
    return false;
  };

  // Search and filtering functions
  const getFilteredEmployees = () => {
    if (!Array.isArray(employees)) return [];
    
    let filtered = employees.filter((emp: any) => {
      // Text search
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const fullName = `${emp.employee?.firstName} ${emp.employee?.lastName}`.toLowerCase();
        const position = emp.position?.toLowerCase() || "";
        const email = emp.employee?.email?.toLowerCase() || "";
        
        if (!fullName.includes(searchLower) && 
            !position.includes(searchLower) && 
            !email.includes(searchLower)) {
          return false;
        }
      }
      
      // Role filter
      if (filterRole !== "all" && emp.hierarchyRole !== filterRole) {
        return false;
      }
      
      // Branch filter
      if (filterBranch !== "all") {
        if (filterBranch === "headquarters" && emp.branchId) {
          return false;
        }
        if (filterBranch !== "headquarters" && emp.branchId !== filterBranch) {
          return false;
        }
      }
      
      // Team filter
      if (filterTeam !== "all") {
        if (filterTeam === "no_team" && emp.teamId) {
          return false;
        }
        if (filterTeam !== "no_team" && emp.teamId !== filterTeam) {
          return false;
        }
      }
      
      // Verification filter
      if (filterVerification !== "all") {
        if (filterVerification === "can_verify" && !emp.canVerifyWork) {
          return false;
        }
        if (filterVerification === "cannot_verify" && emp.canVerifyWork) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sorting
    filtered.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = `${a.employee?.firstName} ${a.employee?.lastName}`.toLowerCase();
          bValue = `${b.employee?.firstName} ${b.employee?.lastName}`.toLowerCase();
          break;
        case "role":
          aValue = a.hierarchyRole || "";
          bValue = b.hierarchyRole || "";
          break;
        case "position":
          aValue = a.position || "";
          bValue = b.position || "";
          break;
        case "branch":
          aValue = a.branchId ? (Array.isArray(branches) ? branches.find((br: any) => br.id === a.branchId)?.name || "" : "") : "Headquarters";
          bValue = b.branchId ? (Array.isArray(branches) ? branches.find((br: any) => br.id === b.branchId)?.name || "" : "") : "Headquarters";
          break;
        case "team":
          aValue = a.teamId ? (Array.isArray(teams) ? teams.find((t: any) => t.id === a.teamId)?.name || "" : "") : "";
          bValue = b.teamId ? (Array.isArray(teams) ? teams.find((t: any) => t.id === b.teamId)?.name || "" : "") : "";
          break;
        default:
          aValue = a[sortBy] || "";
          bValue = b[sortBy] || "";
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterRole("all");
    setFilterBranch("all");
    setFilterTeam("all");
    setFilterVerification("all");
    setSortBy("name");
    setSortOrder("asc");
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "company_admin":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "branch_manager":
        return <Shield className="h-4 w-4 text-blue-600" />;
      case "team_lead":
        return <UserCheck className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "company_admin":
        return "bg-yellow-100 text-yellow-800";
      case "branch_manager":
        return "bg-blue-100 text-blue-800";
      case "team_lead":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="company-hierarchy-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="page-title">
            <Building2 className="h-8 w-8 text-blue-600" />
            Company Hierarchy Management
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="page-description">
            Manage your organizational structure, branches, teams, and employee roles
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateBranchOpen} onOpenChange={setIsCreateBranchOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-branch">
                <Plus className="h-4 w-4 mr-2" />
                New Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Branch</DialogTitle>
                <DialogDescription>
                  Add a new branch office to your organizational structure
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="branch-name">Branch Name</Label>
                  <Input
                    id="branch-name"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    placeholder="e.g., Mumbai Branch, Delhi Office"
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
                <div>
                  <Label htmlFor="branch-description">Description</Label>
                  <Textarea
                    id="branch-description"
                    value={newBranch.description}
                    onChange={(e) => setNewBranch({ ...newBranch, description: e.target.value })}
                    placeholder="Brief description of the branch"
                    data-testid="textarea-branch-description"
                  />
                </div>
                <div>
                  <Label htmlFor="branch-manager">Branch Manager</Label>
                  <Select value={newBranch.managerEmployeeId} onValueChange={(value) => setNewBranch({ ...newBranch, managerEmployeeId: value })}>
                    <SelectTrigger data-testid="select-branch-manager">
                      <SelectValue placeholder="Select a manager (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_manager">No manager assigned</SelectItem>
                      {Array.isArray(employees) && employees
                        .filter((emp: any) => emp.employeeId && emp.employeeId.trim() !== "")
                        .map((emp: any) => (
                        <SelectItem key={emp.employeeId} value={emp.employeeId}>
                          {emp.employee?.firstName || "Unknown"} {emp.employee?.lastName || "Employee"} - {emp.position || "No Position"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => createBranchMutation.mutate(newBranch)}
                  disabled={!newBranch.name || !newBranch.location || createBranchMutation.isPending}
                  className="w-full"
                  data-testid="button-confirm-create-branch"
                >
                  {createBranchMutation.isPending ? "Creating..." : "Create Branch"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-create-team">
                <Plus className="h-4 w-4 mr-2" />
                New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Add a new team to your organizational structure
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="e.g., Sales Team A, Backend Development"
                    data-testid="input-team-name"
                  />
                </div>
                <div>
                  <Label htmlFor="team-branch">Branch Assignment</Label>
                  <Select value={newTeam.branchId} onValueChange={(value) => setNewTeam({ ...newTeam, branchId: value })}>
                    <SelectTrigger data-testid="select-team-branch">
                      <SelectValue placeholder="Select branch (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="headquarters">Headquarters (No Branch)</SelectItem>
                      {Array.isArray(branches) && branches
                        .filter((branch: any) => branch.id && branch.id.trim() !== "")
                        .map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name} - {branch.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="team-lead">Team Lead</Label>
                  <Select value={newTeam.teamLeadEmployeeId} onValueChange={(value) => setNewTeam({ ...newTeam, teamLeadEmployeeId: value })}>
                    <SelectTrigger data-testid="select-team-lead">
                      <SelectValue placeholder="Select team lead (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_lead">No team lead assigned</SelectItem>
                      {Array.isArray(employees) && employees
                        .filter((emp: any) => emp.employeeId && emp.employeeId.trim() !== "")
                        .map((emp: any) => (
                        <SelectItem key={emp.employeeId} value={emp.employeeId}>
                          {emp.employee?.firstName || "Unknown"} {emp.employee?.lastName || "Employee"} - {emp.position || "No Position"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="team-description">Description</Label>
                  <Textarea
                    id="team-description"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Brief description of the team's role"
                    data-testid="textarea-team-description"
                  />
                </div>
                <div>
                  <Label htmlFor="max-members">Maximum Members</Label>
                  <Input
                    id="max-members"
                    type="number"
                    value={newTeam.maxMembers}
                    onChange={(e) => setNewTeam({ ...newTeam, maxMembers: parseInt(e.target.value) || 10 })}
                    min="1"
                    max="50"
                    data-testid="input-max-members"
                  />
                </div>
                <Button 
                  onClick={() => createTeamMutation.mutate(newTeam)}
                  disabled={!newTeam.name || createTeamMutation.isPending}
                  className="w-full"
                  data-testid="button-confirm-create-team"
                >
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator />

      {/* User Permissions Info */}
      {getCurrentUserEmployee() && (
        <Card className="mb-6" data-testid="user-permissions-info">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getRoleIcon(getCurrentUserEmployee()?.hierarchyRole)}
                <div>
                  <h3 className="font-medium">
                    {getCurrentUserEmployee()?.employee?.firstName} {getCurrentUserEmployee()?.employee?.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getCurrentUserEmployee()?.hierarchyRole?.replace('_', ' ')} • {getCurrentUserEmployee()?.position}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Permissions:</span>
                  <div className="flex gap-1">
                    <Badge variant={canManageBranches() ? "default" : "secondary"} className="text-xs">
                      {canManageBranches() ? "✓" : "✗"} Branches
                    </Badge>
                    <Badge variant={canManageTeams() ? "default" : "secondary"} className="text-xs">
                      {canManageTeams() ? "✓" : "✗"} Teams
                    </Badge>
                    <Badge variant={getCurrentUserEmployee()?.canVerifyWork ? "default" : "secondary"} className="text-xs">
                      {getCurrentUserEmployee()?.canVerifyWork ? "✓" : "✗"} Verify Work
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Scope: {getCurrentUserEmployee()?.verificationScope || "none"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      {structure && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="hierarchy-stats">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-branches">
                    {Array.isArray((structure as any)?.branches) ? (structure as any).branches.length : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Branches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-teams">
                    {Array.isArray((structure as any)?.teams) ? (structure as any).teams.length : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-employees">
                    {Array.isArray((structure as any)?.employees) ? (structure as any).employees.length : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-verifiers">
                    {Array.isArray((structure as any)?.employees) ? (structure as any).employees.filter((emp: any) => emp.canVerifyWork).length : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Verifiers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="structure" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4" data-testid="hierarchy-tabs">
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="employees">Employee Roles</TabsTrigger>
        </TabsList>

        {/* Structure Tab */}
        <TabsContent value="structure" className="space-y-4">
          <Card data-testid="structure-visualization">
            <CardHeader>
              <CardTitle>Organizational Structure</CardTitle>
              <CardDescription>
                Visual representation of your company hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {structureLoading ? (
                <div className="text-center py-8" data-testid="structure-loading">
                  Loading structure...
                </div>
              ) : structure ? (
                <div className="space-y-6" data-testid="structure-tree">
                  {/* Company Level */}
                  <div className="flex items-center gap-2 p-4 border rounded-lg bg-blue-50">
                    <Crown className="h-6 w-6 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold">Company Headquarters</h3>
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray((structure as any)?.employees) ? (structure as any).employees.filter((emp: any) => emp.hierarchyRole === 'company_admin').length : 0} Admins
                      </p>
                    </div>
                  </div>

                  {/* Branches Level */}
                  {Array.isArray((structure as any)?.branches) && (structure as any).branches.map((branch: any) => (
                    <div key={branch.id} className="ml-6 space-y-4" data-testid={`branch-${branch.id}`}>
                      <div className="flex items-center gap-2 p-4 border rounded-lg bg-blue-50">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <h4 className="font-semibold">{branch.name}</h4>
                          <p className="text-sm text-muted-foreground">{branch.location}</p>
                        </div>
                        <Badge variant="outline">
                          {Array.isArray((structure as any)?.employees) ? 
                            (structure as any).employees.filter((emp: any) => emp.branchId === branch.id).length : 0} employees
                        </Badge>
                      </div>

                      {/* Teams in this branch */}
                      {Array.isArray((structure as any)?.teams) && 
                        (structure as any).teams
                          .filter((team: any) => team.branchId === branch.id)
                          .map((team: any) => (
                            <div key={team.id} className="ml-6 flex items-center gap-2 p-3 border rounded-lg bg-green-50" data-testid={`team-${team.id}`}>
                              <Users className="h-4 w-4 text-green-600" />
                              <div className="flex-1">
                                <h5 className="font-medium">{team.name}</h5>
                                <p className="text-sm text-muted-foreground">Max {team.maxMembers} members</p>
                              </div>
                              <Badge variant="outline" className="bg-green-100">
                                {Array.isArray((structure as any)?.employees) ? 
                                  (structure as any).employees.filter((emp: any) => emp.teamId === team.id).length : 0} members
                              </Badge>
                            </div>
                          ))
                      }
                    </div>
                  ))}

                  {/* HQ Teams (no branch) */}
                  {Array.isArray((structure as any)?.teams) && 
                    (structure as any).teams
                      .filter((team: any) => !team.branchId)
                      .map((team: any) => (
                        <div key={team.id} className="ml-6 flex items-center gap-2 p-3 border rounded-lg bg-green-50" data-testid={`hq-team-${team.id}`}>
                          <Users className="h-4 w-4 text-green-600" />
                          <div className="flex-1">
                            <h5 className="font-medium">{team.name} (HQ)</h5>
                            <p className="text-sm text-muted-foreground">Max {team.maxMembers} members</p>
                          </div>
                          <Badge variant="outline" className="bg-green-100">
                            {Array.isArray((structure as any)?.employees) ? 
                              (structure as any).employees.filter((emp: any) => emp.teamId === team.id).length : 0} members
                          </Badge>
                        </div>
                      ))
                  }
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-structure">
                  No organizational structure data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          <Card data-testid="branches-management">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Branch Management</CardTitle>
                  <CardDescription>
                    Manage your company branches and locations
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {!canManageBranches() && (
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-yellow-50 rounded border">
                      Admin/Manager Only
                    </span>
                  )}
                  <Button 
                    onClick={() => setIsCreateBranchOpen(true)} 
                    disabled={!canManageBranches()}
                    data-testid="create-branch-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Branch
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {branchesLoading ? (
                <div className="text-center py-4" data-testid="branches-loading">Loading branches...</div>
              ) : Array.isArray(branches) && branches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="branches-grid">
                  {branches.map((branch: any) => (
                    <Card key={branch.id} data-testid={`branch-card-${branch.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              {branch.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">{branch.location}</p>
                            {branch.description && (
                              <p className="text-sm mt-2">{branch.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                              <Badge className={branch.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {branch.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                ID: {branch.branchId || branch.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditBranch(branch)}
                              disabled={!canEditBranch(branch)}
                              data-testid={`edit-branch-${branch.id}`}
                              title={!canEditBranch(branch) ? "You don't have permission to edit this branch" : "Edit branch"}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteBranch(branch)}
                              disabled={!canEditBranch(branch)}
                              data-testid={`delete-branch-${branch.id}`}
                              title={!canEditBranch(branch) ? "You don't have permission to delete this branch" : "Delete branch"}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-branches">
                  No branches created yet. Create your first branch to organize your company structure.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          <Card data-testid="teams-management">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Management</CardTitle>
                  <CardDescription>
                    Organize teams within branches or at headquarters
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {!canManageTeams() && (
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-yellow-50 rounded border">
                      Manager/Lead Only
                    </span>
                  )}
                  <Button 
                    onClick={() => setIsCreateTeamOpen(true)} 
                    disabled={!canManageTeams()}
                    data-testid="create-team-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <div className="text-center py-4" data-testid="teams-loading">Loading teams...</div>
              ) : Array.isArray(teams) && teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="teams-grid">
                  {teams.map((team: any) => (
                    <Card key={team.id} data-testid={`team-card-${team.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Users className="h-4 w-4 text-green-600" />
                              {team.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {team.branchId ? `Branch Team` : "Headquarters Team"}
                            </p>
                            {team.description && (
                              <p className="text-sm mt-2">{team.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                              <Badge className={team.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {team.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Max {team.maxMembers} members
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditTeam(team)}
                              disabled={!canEditTeam(team)}
                              data-testid={`edit-team-${team.id}`}
                              title={!canEditTeam(team) ? "You don't have permission to edit this team" : "Edit team"}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteTeam(team)}
                              disabled={!canEditTeam(team)}
                              data-testid={`delete-team-${team.id}`}
                              title={!canEditTeam(team) ? "You don't have permission to delete this team" : "Delete team"}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-teams">
                  No teams created yet. Create your first team to organize employees effectively.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Roles Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card data-testid="employee-roles-management">
            <CardHeader>
              <CardTitle>Employee Assignment & Role Management</CardTitle>
              <CardDescription>
                Assign employees to branches/teams and manage their hierarchy roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="space-y-4 mb-6" data-testid="employee-search-filters">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees by name, position, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                    data-testid="employee-search-input"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      data-testid="clear-search"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filters:</span>
                  </div>
                  
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[140px]" data-testid="filter-role">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="team_lead">Team Lead</SelectItem>
                      <SelectItem value="branch_manager">Branch Manager</SelectItem>
                      <SelectItem value="company_admin">Company Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterBranch} onValueChange={setFilterBranch}>
                    <SelectTrigger className="w-[160px]" data-testid="filter-branch">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="headquarters">Headquarters</SelectItem>
                      {Array.isArray(branches) && branches.map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterTeam} onValueChange={setFilterTeam}>
                    <SelectTrigger className="w-[140px]" data-testid="filter-team">
                      <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      <SelectItem value="no_team">No Team</SelectItem>
                      {Array.isArray(teams) && teams.map((team: any) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterVerification} onValueChange={setFilterVerification}>
                    <SelectTrigger className="w-[160px]" data-testid="filter-verification">
                      <SelectValue placeholder="All Verifiers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      <SelectItem value="can_verify">Can Verify</SelectItem>
                      <SelectItem value="cannot_verify">Cannot Verify</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Controls and Clear */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Sort by:</span>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[120px]" data-testid="sort-by">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="role">Role</SelectItem>
                          <SelectItem value="position">Position</SelectItem>
                          <SelectItem value="branch">Branch</SelectItem>
                          <SelectItem value="team">Team</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        data-testid="sort-order"
                      >
                        {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {getFilteredEmployees().length} of {Array.isArray(employees) ? employees.length : 0} employees
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    data-testid="clear-filters"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              {employeesLoading ? (
                <div className="text-center py-4" data-testid="employees-loading">Loading employees...</div>
              ) : getFilteredEmployees().length > 0 ? (
                <div className="space-y-3" data-testid="employees-list">
                  {getFilteredEmployees().map((emp: any) => (
                    <div key={emp.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors" data-testid={`employee-${emp.id}`}>
                      <div className="flex items-center gap-4">
                        {getRoleIcon(emp.hierarchyRole)}
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {emp.employee?.firstName} {emp.employee?.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">{emp.position}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getRoleBadgeColor(emp.hierarchyRole)}>
                              {emp.hierarchyRole?.replace('_', ' ') || 'employee'}
                            </Badge>
                            {emp.canVerifyWork && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                Can Verify
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex flex-col items-end">
                            <span>
                              {emp.branchId ? 
                                (Array.isArray(branches) ? branches.find((b: any) => b.id === emp.branchId)?.name || "Unknown Branch" : "Unknown Branch")
                                : "Headquarters"}
                            </span>
                            {emp.teamId && (
                              <span className="text-xs">
                                Team: {Array.isArray(teams) ? teams.find((t: any) => t.id === emp.teamId)?.name || "Unknown Team" : "Unknown Team"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!canManageEmployee(emp) && (
                          <span className="text-xs text-muted-foreground px-2 py-1 bg-yellow-50 rounded border">
                            No Permission
                          </span>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleManageEmployee(emp)}
                          disabled={!canManageEmployee(emp)}
                          data-testid={`manage-employee-${emp.id}`}
                          title={!canManageEmployee(emp) ? "You don't have permission to manage this employee" : "Manage employee"}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-employees">
                  {Array.isArray(employees) && employees.length > 0 ? 
                    "No employees match your search criteria. Try adjusting your filters." :
                    "No employees found. Invite employees to join your company first."
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Branch Dialog */}
      <Dialog open={isEditBranchOpen} onOpenChange={setIsEditBranchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update {selectedBranch?.name}'s details and settings
            </DialogDescription>
          </DialogHeader>
          {selectedBranch && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-branch-name">Branch Name</Label>
                <Input
                  id="edit-branch-name"
                  value={editBranch.name}
                  onChange={(e) => setEditBranch({ ...editBranch, name: e.target.value })}
                  placeholder="e.g., Mumbai Branch, Delhi Office"
                  data-testid="input-edit-branch-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-branch-location">Location</Label>
                <Input
                  id="edit-branch-location"
                  value={editBranch.location}
                  onChange={(e) => setEditBranch({ ...editBranch, location: e.target.value })}
                  placeholder="e.g., Mumbai, Maharashtra"
                  data-testid="input-edit-branch-location"
                />
              </div>
              <div>
                <Label htmlFor="edit-branch-description">Description</Label>
                <Textarea
                  id="edit-branch-description"
                  value={editBranch.description}
                  onChange={(e) => setEditBranch({ ...editBranch, description: e.target.value })}
                  placeholder="Brief description of the branch"
                  data-testid="textarea-edit-branch-description"
                />
              </div>
              <div>
                <Label htmlFor="edit-branch-manager">Branch Manager</Label>
                <Select value={editBranch.managerEmployeeId} onValueChange={(value) => setEditBranch({ ...editBranch, managerEmployeeId: value })}>
                  <SelectTrigger data-testid="select-edit-branch-manager">
                    <SelectValue placeholder="Select a manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_manager">No manager assigned</SelectItem>
                    {Array.isArray(employees) && employees
                      .filter((emp: any) => emp.employeeId && emp.employeeId.trim() !== "")
                      .map((emp: any) => (
                      <SelectItem key={emp.employeeId} value={emp.employeeId}>
                        {emp.employee?.firstName || "Unknown"} {emp.employee?.lastName || "Employee"} - {emp.position || "No Position"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-branch-active">Branch Active</Label>
                <Switch
                  id="edit-branch-active"
                  checked={editBranch.isActive}
                  onCheckedChange={(checked) => setEditBranch({ ...editBranch, isActive: checked })}
                  data-testid="switch-edit-branch-active"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => updateBranchMutation.mutate({ 
                    branchId: selectedBranch.id, 
                    updates: editBranch 
                  })}
                  disabled={!editBranch.name || !editBranch.location || updateBranchMutation.isPending}
                  className="flex-1"
                  data-testid="button-update-branch"
                >
                  {updateBranchMutation.isPending ? "Updating..." : "Update Branch"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditBranchOpen(false)}
                  className="flex-1"
                  data-testid="button-cancel-edit-branch"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirmation Dialog */}
      <Dialog open={isDeleteBranchOpen} onOpenChange={setIsDeleteBranchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Branch
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedBranch?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedBranch && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">This will:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Remove the branch from your organization</li>
                  <li>• Move all teams in this branch to headquarters</li>
                  <li>• Reassign all employees to headquarters</li>
                  <li>• Remove all branch-specific permissions</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="destructive"
                  onClick={() => deleteBranchMutation.mutate(selectedBranch.id)}
                  disabled={deleteBranchMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-delete-branch"
                >
                  {deleteBranchMutation.isPending ? "Deleting..." : "Delete Branch"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteBranchOpen(false)}
                  className="flex-1"
                  data-testid="button-cancel-delete-branch"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update {selectedTeam?.name}'s details and settings
            </DialogDescription>
          </DialogHeader>
          {selectedTeam && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-team-name">Team Name</Label>
                <Input
                  id="edit-team-name"
                  value={editTeam.name}
                  onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })}
                  placeholder="e.g., Sales Team A, Backend Development"
                  data-testid="input-edit-team-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-team-branch">Branch Assignment</Label>
                <Select value={editTeam.branchId} onValueChange={(value) => setEditTeam({ ...editTeam, branchId: value })}>
                  <SelectTrigger data-testid="select-edit-team-branch">
                    <SelectValue placeholder="Select branch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="headquarters">Headquarters (No Branch)</SelectItem>
                    {Array.isArray(branches) && branches
                      .filter((branch: any) => branch.id && branch.id.trim() !== "")
                      .map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} - {branch.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-team-lead">Team Lead</Label>
                <Select value={editTeam.teamLeadEmployeeId} onValueChange={(value) => setEditTeam({ ...editTeam, teamLeadEmployeeId: value })}>
                  <SelectTrigger data-testid="select-edit-team-lead">
                    <SelectValue placeholder="Select team lead (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_lead">No team lead assigned</SelectItem>
                    {Array.isArray(employees) && employees
                      .filter((emp: any) => emp.employeeId && emp.employeeId.trim() !== "")
                      .map((emp: any) => (
                      <SelectItem key={emp.employeeId} value={emp.employeeId}>
                        {emp.employee?.firstName || "Unknown"} {emp.employee?.lastName || "Employee"} - {emp.position || "No Position"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-team-description">Description</Label>
                <Textarea
                  id="edit-team-description"
                  value={editTeam.description}
                  onChange={(e) => setEditTeam({ ...editTeam, description: e.target.value })}
                  placeholder="Brief description of the team's role"
                  data-testid="textarea-edit-team-description"
                />
              </div>
              <div>
                <Label htmlFor="edit-max-members">Maximum Members</Label>
                <Input
                  id="edit-max-members"
                  type="number"
                  value={editTeam.maxMembers}
                  onChange={(e) => setEditTeam({ ...editTeam, maxMembers: parseInt(e.target.value) || 10 })}
                  min="1"
                  max="50"
                  data-testid="input-edit-max-members"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-team-active">Team Active</Label>
                <Switch
                  id="edit-team-active"
                  checked={editTeam.isActive}
                  onCheckedChange={(checked) => setEditTeam({ ...editTeam, isActive: checked })}
                  data-testid="switch-edit-team-active"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => updateTeamMutation.mutate({ 
                    teamId: selectedTeam.id, 
                    updates: editTeam 
                  })}
                  disabled={!editTeam.name || updateTeamMutation.isPending}
                  className="flex-1"
                  data-testid="button-update-team"
                >
                  {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditTeamOpen(false)}
                  className="flex-1"
                  data-testid="button-cancel-edit-team"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <Dialog open={isDeleteTeamOpen} onOpenChange={setIsDeleteTeamOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Team
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTeam?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedTeam && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">This will:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Remove the team from your organization</li>
                  <li>• Reassign all team members to their branch or headquarters</li>
                  <li>• Remove all team-specific permissions and assignments</li>
                  <li>• Archive all team-related work entries and data</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="destructive"
                  onClick={() => deleteTeamMutation.mutate(selectedTeam.id)}
                  disabled={deleteTeamMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-delete-team"
                >
                  {deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteTeamOpen(false)}
                  className="flex-1"
                  data-testid="button-cancel-delete-team"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Employee Hierarchy Management Dialog */}
      <Dialog open={isManageEmployeeOpen} onOpenChange={setIsManageEmployeeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Employee Assignment & Permissions</DialogTitle>
            <DialogDescription>
              Update {selectedEmployee?.employee?.firstName} {selectedEmployee?.employee?.lastName}'s assignment, role and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              {/* Employee Info Section */}
              <div className="p-4 bg-blue-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  {getRoleIcon(selectedEmployee.hierarchyRole)}
                  <div>
                    <h4 className="font-medium">{selectedEmployee.employee?.firstName} {selectedEmployee.employee?.lastName}</h4>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.position}</p>
                    <p className="text-xs text-muted-foreground">Employee ID: {selectedEmployee.employeeId}</p>
                  </div>
                </div>
              </div>

              {/* Assignment Section */}
              <div className="space-y-4">
                <h4 className="font-medium">Organizational Assignment</h4>
                
                <div>
                  <Label htmlFor="employee-branch">Branch Assignment</Label>
                  <Select value={employeeUpdate.branchId} onValueChange={(value) => setEmployeeUpdate({ ...employeeUpdate, branchId: value, teamId: value ? employeeUpdate.teamId : "" })}>
                    <SelectTrigger data-testid="select-employee-branch">
                      <SelectValue placeholder="Select branch (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="headquarters">Headquarters (No Branch)</SelectItem>
                      {Array.isArray(branches) && branches
                        .filter((branch: any) => branch.id && branch.id.trim() !== "")
                        .map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name} - {branch.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="employee-team">Team Assignment</Label>
                  <Select 
                    value={employeeUpdate.teamId} 
                    onValueChange={(value) => setEmployeeUpdate({ ...employeeUpdate, teamId: value })}
                    disabled={!employeeUpdate.branchId && teams?.filter((t: any) => !t.branchId).length === 0}
                  >
                    <SelectTrigger data-testid="select-employee-team">
                      <SelectValue placeholder="Select team (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_team">No Team</SelectItem>
                      {Array.isArray(teams) && teams
                        .filter((team: any) => 
                          employeeUpdate.branchId ? 
                            team.branchId === employeeUpdate.branchId : 
                            !team.branchId
                        )
                        .filter((team: any) => team.id && team.id.trim() !== "")
                        .map((team: any) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name} {team.branchId ? "" : "(HQ)"}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {employeeUpdate.branchId ? 
                      "Only teams in the selected branch are available" : 
                      "Only headquarters teams are available when no branch is selected"
                    }
                  </p>
                </div>
              </div>

              {/* Role & Permissions Section */}
              <div className="space-y-4">
                <h4 className="font-medium">Role & Hierarchy</h4>
                
                <div>
                  <Label htmlFor="hierarchy-role">Hierarchy Role</Label>
                  <Select value={employeeUpdate.hierarchyRole} onValueChange={(value) => setEmployeeUpdate({ ...employeeUpdate, hierarchyRole: value })}>
                    <SelectTrigger data-testid="select-hierarchy-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="team_lead">Team Lead</SelectItem>
                      <SelectItem value="branch_manager">Branch Manager</SelectItem>
                      <SelectItem value="company_admin">Company Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Permissions & Authority</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="can-verify-work">Can Verify Work</Label>
                  <Switch
                    id="can-verify-work"
                    checked={employeeUpdate.canVerifyWork}
                    onCheckedChange={(checked) => setEmployeeUpdate({ ...employeeUpdate, canVerifyWork: checked })}
                    data-testid="switch-can-verify-work"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can-manage-employees">Can Manage Employees</Label>
                  <Switch
                    id="can-manage-employees"
                    checked={employeeUpdate.canManageEmployees}
                    onCheckedChange={(checked) => setEmployeeUpdate({ ...employeeUpdate, canManageEmployees: checked })}
                    data-testid="switch-can-manage-employees"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can-create-teams">Can Create Teams</Label>
                  <Switch
                    id="can-create-teams"
                    checked={employeeUpdate.canCreateTeams}
                    onCheckedChange={(checked) => setEmployeeUpdate({ ...employeeUpdate, canCreateTeams: checked })}
                    data-testid="switch-can-create-teams"
                  />
                </div>

                <div>
                  <Label htmlFor="verification-scope">Verification Scope</Label>
                  <Select value={employeeUpdate.verificationScope} onValueChange={(value) => setEmployeeUpdate({ ...employeeUpdate, verificationScope: value })}>
                    <SelectTrigger data-testid="select-verification-scope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="team">Team Level - Can verify team members' work</SelectItem>
                      <SelectItem value="branch">Branch Level - Can verify entire branch</SelectItem>
                      <SelectItem value="company">Company Level - Can verify company-wide</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Determines what level of work entries this employee can verify
                  </p>
                </div>
              </div>

              {/* Assignment Summary */}
              <div className="p-3 bg-gray-50 rounded-lg border">
                <h5 className="font-medium text-sm mb-2">Assignment Summary</h5>
                <div className="text-xs space-y-1">
                  <div>Branch: {employeeUpdate.branchId ? branches?.find((b: any) => b.id === employeeUpdate.branchId)?.name || "Unknown" : "Headquarters"}</div>
                  <div>Team: {employeeUpdate.teamId ? teams?.find((t: any) => t.id === employeeUpdate.teamId)?.name || "Unknown" : "No Team"}</div>
                  <div>Role: {employeeUpdate.hierarchyRole.replace('_', ' ')}</div>
                  <div>Can Verify: {employeeUpdate.canVerifyWork ? `Yes (${employeeUpdate.verificationScope})` : "No"}</div>
                </div>
              </div>

              <Button 
                onClick={() => updateEmployeeHierarchyMutation.mutate({ 
                  employeeId: selectedEmployee.employeeId, 
                  updates: employeeUpdate 
                })}
                disabled={updateEmployeeHierarchyMutation.isPending}
                className="w-full"
                data-testid="button-update-employee-hierarchy"
              >
                {updateEmployeeHierarchyMutation.isPending ? "Updating..." : "Update Employee"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}