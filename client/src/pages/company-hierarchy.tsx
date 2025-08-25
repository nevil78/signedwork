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
  X,
  ShieldCheck,
  Key,
  Mail,
  Calendar,
  Clock,
  AlertTriangle,
  Lock,
  Activity,
  UserPlus
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
  const [isCreateManagerOpen, setIsCreateManagerOpen] = useState(false);
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

  const [newManager, setNewManager] = useState({
    employeeId: "",
    username: "",
    password: "",
    confirmPassword: "",
    accessLevel: "branch_manager",
    canLogin: true,
    permissions: {
      canManageEmployees: true,
      canCreateTeams: false,
      canVerifyWork: true,
      canViewReports: true,
      canManageBranches: false
    }
  });

  // Search and filter state for manager creation
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  
  // Step-by-step manager creation state
  const [managerCreationStep, setManagerCreationStep] = useState(1);
  const [stepValidation, setStepValidation] = useState({
    step1: false, // Employee selection
    step2: false, // Login credentials  
    step3: false, // Access level & permissions
    step4: false  // Review & confirm
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Validation functions for step-by-step process
  const validateStep = (step: number) => {
    switch (step) {
      case 1: // Employee selection
        return !!newManager.employeeId;
      case 2: // Login credentials
        return (
          newManager.username.length >= 3 &&
          newManager.password.length >= 6 &&
          newManager.password === newManager.confirmPassword
        );
      case 3: // Access level & permissions
        return !!newManager.accessLevel;
      case 4: // Review & confirm
        return validateStep(1) && validateStep(2) && validateStep(3);
      default:
        return false;
    }
  };

  // Update step validation when manager data changes
  useEffect(() => {
    setStepValidation({
      step1: validateStep(1),
      step2: validateStep(2),
      step3: validateStep(3),
      step4: validateStep(4)
    });
  }, [newManager]);

  // Navigation functions
  const goToNextStep = () => {
    if (validateStep(managerCreationStep) && managerCreationStep < 4) {
      setManagerCreationStep(managerCreationStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (managerCreationStep > 1) {
      setManagerCreationStep(managerCreationStep - 1);
    }
  };

  const resetManagerForm = () => {
    setNewManager({
      employeeId: "",
      username: "",
      password: "",
      confirmPassword: "",
      accessLevel: "branch_manager",
      canLogin: true,
      permissions: {
        canManageEmployees: true,
        canCreateTeams: false,
        canVerifyWork: true,
        canViewReports: true,
        canManageBranches: false
      }
    });
    setManagerCreationStep(1);
    setEmployeeSearchQuery('');
    setEmployeeFilter('all');
  };

  // Real-time data queries with optimized refetch intervals and performance caching
  const { data: structure, isLoading: structureLoading, refetch: refetchStructure } = useQuery({
    queryKey: ["/api/company/structure"],
    refetchInterval: 30000, // Refetch every 30 seconds for live organizational changes
    staleTime: 15000, // Consider data stale after 15 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  const { data: branches, isLoading: branchesLoading, refetch: refetchBranches } = useQuery({
    queryKey: ["/api/company/branches"],
    refetchInterval: 60000, // Less frequent for structural data
    staleTime: 30000,
    gcTime: 600000, // Keep branches in cache for 10 minutes
  });

  const { data: teams, isLoading: teamsLoading, refetch: refetchTeams } = useQuery({
    queryKey: ["/api/company/teams"],
    refetchInterval: 45000, // Moderate frequency for team updates
    staleTime: 25000,
    gcTime: 600000,
  });

  const { data: employees, isLoading: employeesLoading, refetch: refetchEmployees } = useQuery({
    queryKey: ["/api/company/employees"],
    refetchInterval: 30000, // More frequent for employee status changes
    staleTime: 20000,
    gcTime: 300000,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    staleTime: 600000, // User data rarely changes, cache for 10 minutes
    gcTime: 1800000, // Keep user data for 30 minutes
  });

  // Performance monitoring and optimization state
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [updateCount, setUpdateCount] = useState(0);
  const [isOptimizedView, setIsOptimizedView] = useState(false);

  // Auto-refresh handler for real-time updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh data when user returns to tab
        refetchStructure();
        refetchEmployees();
        refetchBranches();
        refetchTeams();
        setLastUpdateTime(new Date());
        setUpdateCount(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchStructure, refetchEmployees, refetchBranches, refetchTeams]);

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

  const createManagerMutation = useMutation({
    mutationFn: async (managerData: any) => {
      return apiRequest("/api/company/managers", "POST", managerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      setIsCreateManagerOpen(false);
      setNewManager({
        employeeId: "",
        username: "",
        password: "",
        confirmPassword: "",
        accessLevel: "branch_manager",
        canLogin: true,
        permissions: {
          canManageEmployees: true,
          canCreateTeams: false,
          canVerifyWork: true,
          canViewReports: true,
          canManageBranches: false
        }
      });
      toast({ title: "Success", description: "Manager account created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create manager account", variant: "destructive" });
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
    return employees.find((emp: any) => emp.employee?.email === (currentUser as any)?.email);
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
        
        {/* Real-time Status & Performance Controls */}
        <div className="flex items-center gap-4">
          {/* Live Update Status */}
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-xs">
              <div className="font-medium text-green-900">Live Updates</div>
              <div className="text-green-700">
                Last: {lastUpdateTime.toLocaleTimeString()} ({updateCount} updates)
              </div>
            </div>
          </div>

          {/* Performance Toggle */}
          <div className="flex items-center gap-2">
            <Label htmlFor="optimized-view" className="text-xs">Optimized View</Label>
            <Switch
              id="optimized-view"
              checked={isOptimizedView}
              onCheckedChange={setIsOptimizedView}
              title={isOptimizedView ? 'Showing summarized data for better performance' : 'Switch to optimized view for large datasets'}
            />
          </div>

          {/* Manual Refresh */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              refetchStructure();
              refetchEmployees();
              refetchBranches();
              refetchTeams();
              setLastUpdateTime(new Date());
              setUpdateCount(prev => prev + 1);
              toast({ title: "Data Refreshed", description: "All organizational data has been updated" });
            }}
            className="flex items-center gap-2"
          >
            <Activity className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Performance Indicator */}
      {(structureLoading || employeesLoading || branchesLoading || teamsLoading) && (
        <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-800 font-medium">
              {structureLoading && "Loading organizational structure..."}
              {employeesLoading && "Loading employee data..."}
              {branchesLoading && "Loading branch information..."}
              {teamsLoading && "Loading team details..."}
            </span>
          </div>
        </div>
      )}

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
        <TabsList className="grid w-full grid-cols-5" data-testid="hierarchy-tabs">
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="employees">Employee Roles</TabsTrigger>
          <TabsTrigger value="managers">Manager Accounts</TabsTrigger>
        </TabsList>

        {/* Structure Tab */}
        <TabsContent value="structure" className="space-y-4">
          {/* Smart Navigation Breadcrumb */}
          <Card className="p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600">Current View:</span>
                <span className="font-medium">Company Structure</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">All Levels</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                  <Search className="h-4 w-4 mr-1" />
                  Search Org
                </Button>
                <Input
                  placeholder="Find employee, team, or branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
            
            {/* Quick Jump Buttons */}
            {(Array.isArray(branches) && branches.length > 0) || (Array.isArray(teams) && teams.length > 0) ? (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-xs text-gray-500 mr-2">Quick Jump:</span>
                {Array.isArray(branches) && branches.slice(0, 3).map((branch: any) => (
                  <Button 
                    key={branch.id}
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => {
                      const element = document.querySelector(`[data-testid="branch-${branch.id}"]`);
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    {branch.name}
                  </Button>
                ))}
                {Array.isArray(teams) && teams.filter(t => !t.branchId).slice(0, 2).map((team: any) => (
                  <Button 
                    key={team.id}
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => {
                      const element = document.querySelector(`[data-testid="hq-team-${team.id}"]`);
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {team.name} (HQ)
                  </Button>
                ))}
                {Array.isArray(branches) && branches.length > 3 && (
                  <span className="text-xs text-gray-400">+{branches.length - 3} more</span>
                )}
              </div>
            ) : (
              <Card className="p-4 border-dashed border-gray-300">
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Organizational Data</h3>
                  <p className="text-sm text-gray-600">Load organizational data to see navigation and statistics</p>
                </div>
              </Card>
            )}
          </Card>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Crown className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(employees) ? employees.filter((emp: any) => emp.hierarchyRole === 'company_admin').length : 0}</p>
                  <p className="text-xs text-muted-foreground">Company Admins</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(branches) ? branches.length : 0}</p>
                  <p className="text-xs text-muted-foreground">Active Branches</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(teams) ? teams.length : 0}</p>
                  <p className="text-xs text-muted-foreground">Active Teams</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(employees) ? employees.length : 0}</p>
                  <p className="text-xs text-muted-foreground">Total Employees</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Organizational Health Panel */}
          {structure && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Organizational Health Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Structure Health */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900">Structure Balance</h4>
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(branches) && branches.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-blue-800">{branches.length} branches active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs text-blue-800">Centralized structure</span>
                        </div>
                      )}
                      {Array.isArray(teams) && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-blue-800">{teams.length} teams organized</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Capacity Analysis */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-900">Capacity Status</h4>
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(teams) && teams.length > 0 ? (
                        (() => {
                          const overUtilized = teams.filter(team => {
                            const members = Array.isArray(employees) ? employees.filter(emp => emp.teamId === team.id).length : 0;
                            return members / (team.maxMembers || 1) > 0.9;
                          }).length;
                          
                          const underUtilized = teams.filter(team => {
                            const members = Array.isArray(employees) ? employees.filter(emp => emp.teamId === team.id).length : 0;
                            return members / (team.maxMembers || 1) < 0.3 && members > 0;
                          }).length;

                          return (
                            <>
                              {overUtilized > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="text-xs text-green-800">{overUtilized} teams over capacity</span>
                                </div>
                              )}
                              {underUtilized > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <span className="text-xs text-green-800">{underUtilized} teams underutilized</span>
                                </div>
                              )}
                              {overUtilized === 0 && underUtilized === 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-xs text-green-800">Optimal capacity balance</span>
                                </div>
                              )}
                            </>
                          );
                        })()
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-xs text-green-800">No teams to analyze</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Management Coverage */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-purple-900">Management Coverage</h4>
                      <Crown className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(employees) && (
                        (() => {
                          const managers = employees.filter(emp => 
                            ['company_admin', 'branch_manager', 'team_lead'].includes(emp.hierarchyRole)
                          ).length;
                          const totalEmployees = employees.length;
                          const managementRatio = totalEmployees > 0 ? (managers / totalEmployees) : 0;
                          
                          return (
                            <>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${managementRatio > 0.3 ? 'bg-red-500' : managementRatio > 0.15 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                <span className="text-xs text-purple-800">{managers} managers ({Math.round(managementRatio * 100)}%)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${managementRatio < 0.05 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                <span className="text-xs text-purple-800">
                                  {managementRatio < 0.05 ? 'Need more leaders' : 
                                   managementRatio > 0.3 ? 'Too many managers' : 'Healthy ratio'}
                                </span>
                              </div>
                            </>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interactive Structure Visualization */}
          <Card data-testid="structure-visualization">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Interactive Organization Chart
                  </CardTitle>
                  <CardDescription>
                    Visual hierarchy with real-time capacity and health indicators
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Full Screen
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {structureLoading ? (
                <div className="text-center py-8" data-testid="structure-loading">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  Loading organizational structure...
                </div>
              ) : structure ? (
                <div className="space-y-6" data-testid="structure-tree">
                  {/* Company Headquarters */}
                  <div className="relative">
                    <div className="flex items-center justify-between p-6 border-2 border-yellow-200 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center shadow-sm">
                          <Crown className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Company Headquarters</h3>
                          <p className="text-sm text-gray-600">Central Command & Administration</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {Array.isArray(employees) ? employees.filter((emp: any) => emp.hierarchyRole === 'company_admin').length : 0} Admins
                          </Badge>
                          <Badge variant="outline">
                            {Array.isArray(employees) ? employees.filter((emp: any) => !emp.branchId).length : 0} HQ Staff
                          </Badge>
                        </div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Health: Excellent</p>
                      </div>
                    </div>

                    {/* Connection Lines */}
                    {Array.isArray(branches) && branches.length > 0 && (
                      <div className="absolute left-6 top-full w-px h-8 bg-gray-300"></div>
                    )}
                  </div>

                  {/* Branches Level */}
                  {Array.isArray(branches) && branches.map((branch: any, branchIndex: number) => {
                    const branchEmployees = Array.isArray(employees) ? employees.filter((emp: any) => emp.branchId === branch.id) : [];
                    const branchTeams = Array.isArray(teams) ? teams.filter((team: any) => team.branchId === branch.id) : [];
                    const utilization = branchTeams.reduce((sum: number, team: any) => {
                      const teamMembers = Array.isArray(employees) ? employees.filter((emp: any) => emp.teamId === team.id).length : 0;
                      return sum + (teamMembers / (team.maxMembers || 1));
                    }, 0) / (branchTeams.length || 1);

                    return (
                      <div key={branch.id} className="relative ml-12" data-testid={`branch-${branch.id}`}>
                        {/* Branch Node */}
                        <div className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm hover:shadow-md transition-shadow group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{branch.name}</h4>
                              <p className="text-sm text-gray-600">{branch.location}</p>
                              {branch.description && (
                                <p className="text-xs text-gray-500 mt-1">{branch.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-blue-100 text-blue-800">
                                  {branchEmployees.length} employees
                                </Badge>
                                <Badge variant="outline">
                                  {branchTeams.length} teams
                                </Badge>
                              </div>
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${utilization > 0.8 ? 'bg-red-500' : utilization > 0.6 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(utilization * 100, 100)}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Capacity: {Math.round(utilization * 100)}%
                              </p>
                            </div>
                            
                            {/* Context-sensitive Actions */}
                            <div className="flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  setSelectedBranch(branch);
                                  setIsCreateTeamOpen(true);
                                }}
                                disabled={!canManageTeams()}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Team
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  // Navigate to employee management for this branch
                                  setSearchQuery(branch.name);
                                }}
                              >
                                <Users className="h-3 w-3 mr-1" />
                                View Staff
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Teams in this branch */}
                        {branchTeams.length > 0 && (
                          <div className="mt-4 ml-8 space-y-3">
                            {branchTeams.map((team: any) => {
                              const teamMembers = Array.isArray(employees) ? employees.filter((emp: any) => emp.teamId === team.id) : [];
                              const teamUtilization = teamMembers.length / (team.maxMembers || 1);
                              
                              return (
                                <div key={team.id} className="relative" data-testid={`team-${team.id}`}>
                                  <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-sm transition-shadow group">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Users className="h-4 w-4 text-green-600" />
                                      </div>
                                      <div>
                                        <h5 className="font-medium text-gray-900">{team.name}</h5>
                                        <p className="text-xs text-gray-600">
                                          {teamMembers.length}/{team.maxMembers} members
                                        </p>
                                        {teamMembers.length > 0 && (
                                          <p className="text-xs text-gray-500">
                                            Manager: {teamMembers.find((emp: any) => emp.hierarchyRole === 'team_lead')?.firstName || 'Unassigned'}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        className={`${teamUtilization > 0.9 ? 'bg-red-100 text-red-800' : teamUtilization > 0.7 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
                                      >
                                        {Math.round(teamUtilization * 100)}% Full
                                      </Badge>
                                      {!team.isActive && (
                                        <Badge variant="destructive" className="text-xs">Inactive</Badge>
                                      )}
                                      {teamUtilization < 0.3 && teamMembers.length > 0 && (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                                          Underutilized
                                        </Badge>
                                      )}
                                      
                                      {/* Team Actions */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                          // Show team member details
                                          setSearchQuery(team.name);
                                        }}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Connection line to next branch */}
                        {branchIndex < branches.length - 1 && (
                          <div className="absolute -left-6 top-full w-px h-8 bg-gray-300"></div>
                        )}
                      </div>
                    );
                  })}

                  {/* Headquarters Teams (not assigned to branches) */}
                  {Array.isArray(teams) && teams.filter((team: any) => !team.branchId).length > 0 && (
                    <div className="ml-12 space-y-3">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Headquarters Teams
                      </h4>
                      {teams
                        .filter((team: any) => !team.branchId)
                        .map((team: any) => {
                          const teamMembers = Array.isArray(employees) ? employees.filter((emp: any) => emp.teamId === team.id) : [];
                          const teamUtilization = teamMembers.length / (team.maxMembers || 1);
                          
                          return (
                            <div key={team.id} data-testid={`hq-team-${team.id}`}>
                              <div className="flex items-center justify-between p-3 border border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Users className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-900">{team.name} <span className="text-xs text-gray-500">(HQ)</span></h5>
                                    <p className="text-xs text-gray-600">
                                      {teamMembers.length}/{team.maxMembers} members
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    className={`${teamUtilization > 0.9 ? 'bg-red-100 text-red-800' : teamUtilization > 0.7 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
                                  >
                                    {Math.round(teamUtilization * 100)}% Full
                                  </Badge>
                                  {!team.isActive && (
                                    <Badge variant="destructive" className="text-xs">Inactive</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="no-structure">
                  <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Build Your Organization</h3>
                  <p className="text-gray-600 mb-4">
                    Create branches and teams to establish your company's organizational structure.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setIsCreateBranchOpen(true)}>
                      <Building2 className="h-4 w-4 mr-2" />
                      Create First Branch
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateTeamOpen(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Create HQ Team
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          {/* Cross-Reference Matrix */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Branch-Employee Assignment Matrix
              </CardTitle>
              <CardDescription>
                Visual mapping of employee distribution across organizational structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(branches) && branches.length > 0 ? (
                <div className="space-y-4">
                  {/* Matrix Header */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 border-b pb-2">
                    <div className="col-span-3">Branch/Team</div>
                    <div className="col-span-2">Total Staff</div>
                    <div className="col-span-2">Capacity</div>
                    <div className="col-span-2">Managers</div>
                    <div className="col-span-2">Utilization</div>
                    <div className="col-span-1">Status</div>
                  </div>

                  {/* Branch Rows */}
                  {branches.map((branch: any) => {
                    const branchEmployees = Array.isArray(employees) ? employees.filter((emp: any) => emp.branchId === branch.id) : [];
                    const branchTeams = Array.isArray(teams) ? teams.filter((team: any) => team.branchId === branch.id) : [];
                    const branchManagers = branchEmployees.filter((emp: any) => emp.hierarchyRole !== 'employee');
                    const totalCapacity = branchTeams.reduce((sum: number, team: any) => sum + (team.maxMembers || 0), 0);
                    const utilization = totalCapacity > 0 ? (branchEmployees.length / totalCapacity) : 0;

                    return (
                      <div key={branch.id} className="space-y-2">
                        {/* Branch Row */}
                        <div className="grid grid-cols-12 gap-2 p-3 bg-blue-50 rounded-lg items-center">
                          <div className="col-span-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-sm">{branch.name}</p>
                              <p className="text-xs text-gray-500">{branch.location}</p>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              {branchEmployees.length} employees
                            </Badge>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm">{totalCapacity} max</span>
                          </div>
                          <div className="col-span-2">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              {branchManagers.length} leaders
                            </Badge>
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${utilization > 0.9 ? 'bg-red-500' : utilization > 0.7 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(utilization * 100, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs">{Math.round(utilization * 100)}%</span>
                            </div>
                          </div>
                          <div className="col-span-1">
                            <div className={`w-3 h-3 rounded-full ${branch.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          </div>
                        </div>

                        {/* Team Rows */}
                        {branchTeams.map((team: any) => {
                          const teamMembers = Array.isArray(employees) ? employees.filter((emp: any) => emp.teamId === team.id) : [];
                          const teamUtilization = (team.maxMembers || 0) > 0 ? teamMembers.length / team.maxMembers : 0;
                          const teamLead = teamMembers.find((emp: any) => emp.hierarchyRole === 'team_lead');

                          return (
                            <div key={team.id} className="grid grid-cols-12 gap-2 p-2 ml-6 bg-green-50 rounded items-center">
                              <div className="col-span-3 flex items-center gap-2">
                                <Users className="h-3 w-3 text-green-600" />
                                <span className="text-sm">{team.name}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-sm">{teamMembers.length}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-sm">{team.maxMembers}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-xs text-gray-600">
                                  {teamLead ? teamLead.firstName + ' ' + teamLead.lastName : 'No lead assigned'}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${teamUtilization > 0.9 ? 'bg-red-500' : teamUtilization > 0.7 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                      style={{ width: `${Math.min(teamUtilization * 100, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs">{Math.round(teamUtilization * 100)}%</span>
                                </div>
                              </div>
                              <div className="col-span-1">
                                <div className={`w-2 h-2 rounded-full ${team.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Headquarters Teams */}
                  {Array.isArray(teams) && teams.filter((team: any) => !team.branchId).length > 0 && (
                    <div className="mt-6 space-y-2">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Headquarters Teams
                      </h4>
                      {teams.filter((team: any) => !team.branchId).map((team: any) => {
                        const teamMembers = Array.isArray(employees) ? employees.filter((emp: any) => emp.teamId === team.id) : [];
                        const teamUtilization = (team.maxMembers || 0) > 0 ? teamMembers.length / team.maxMembers : 0;
                        const teamLead = teamMembers.find((emp: any) => emp.hierarchyRole === 'team_lead');

                        return (
                          <div key={team.id} className="grid grid-cols-12 gap-2 p-2 bg-purple-50 rounded items-center">
                            <div className="col-span-3 flex items-center gap-2">
                              <Crown className="h-3 w-3 text-purple-600" />
                              <span className="text-sm">{team.name} (HQ)</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-sm">{teamMembers.length}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-sm">{team.maxMembers}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-xs text-gray-600">
                                {teamLead ? teamLead.firstName + ' ' + teamLead.lastName : 'No lead assigned'}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${teamUtilization > 0.9 ? 'bg-red-500' : teamUtilization > 0.7 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(teamUtilization * 100, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs">{Math.round(teamUtilization * 100)}%</span>
                              </div>
                            </div>
                            <div className="col-span-1">
                              <div className={`w-2 h-2 rounded-full ${team.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No branches created yet. Create your first branch to see the assignment matrix.</p>
                </div>
              )}
            </CardContent>
          </Card>

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
          {/* Smart Assignment Engine & Conflict Detection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Team Optimization Dashboard
              </CardTitle>
              <CardDescription>
                Conflict detection, capacity analysis, and smart assignment recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(teams) && teams.length > 0 ? (
                <div className="space-y-6">
                  {/* Conflict Detection */}
                  <div className="p-4 border-l-4 border-red-500 bg-red-50">
                    <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Detected Issues
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        const issues = [];
                        
                        // Check for employees in multiple teams
                        if (Array.isArray(employees)) {
                          const employeesInMultipleTeams = employees.filter(emp => 
                            emp.teamId && teams.filter(team => team.id === emp.teamId).length > 1
                          );
                          if (employeesInMultipleTeams.length > 0) {
                            issues.push(`${employeesInMultipleTeams.length} employees assigned to multiple teams`);
                          }
                        }

                        // Check for teams without managers
                        const teamsWithoutLeads = teams.filter(team => {
                          const teamMembers = Array.isArray(employees) ? employees.filter(emp => emp.teamId === team.id) : [];
                          return teamMembers.length > 0 && !teamMembers.some(emp => emp.hierarchyRole === 'team_lead');
                        });
                        if (teamsWithoutLeads.length > 0) {
                          issues.push(`${teamsWithoutLeads.length} active teams missing team leads`);
                        }

                        // Check for over-capacity teams
                        const overCapacityTeams = teams.filter(team => {
                          const teamMembers = Array.isArray(employees) ? employees.filter(emp => emp.teamId === team.id) : [];
                          return teamMembers.length > (team.maxMembers || 0);
                        });
                        if (overCapacityTeams.length > 0) {
                          issues.push(`${overCapacityTeams.length} teams exceed maximum capacity`);
                        }

                        // Check for inactive teams with members
                        const inactiveTeamsWithMembers = teams.filter(team => {
                          const teamMembers = Array.isArray(employees) ? employees.filter(emp => emp.teamId === team.id) : [];
                          return !team.isActive && teamMembers.length > 0;
                        });
                        if (inactiveTeamsWithMembers.length > 0) {
                          issues.push(`${inactiveTeamsWithMembers.length} inactive teams still have assigned members`);
                        }

                        return issues.length > 0 ? (
                          issues.map((issue, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-red-800">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              {issue}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-green-800 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            No organizational conflicts detected
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Smart Recommendations */}
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Optimization Recommendations
                    </h4>
                    <div className="space-y-3">
                      {(() => {
                        const recommendations = [];

                        // Suggest balancing team sizes
                        if (Array.isArray(teams) && teams.length > 1) {
                          const teamSizes = teams.map(team => ({
                            team,
                            size: Array.isArray(employees) ? employees.filter(emp => emp.teamId === team.id).length : 0,
                            capacity: team.maxMembers || 0
                          }));
                          
                          const underutilized = teamSizes.filter(t => t.capacity > 0 && t.size / t.capacity < 0.3 && t.size > 0);
                          const optimal = teamSizes.filter(t => t.capacity > 0 && t.size / t.capacity >= 0.3 && t.size / t.capacity <= 0.8);
                          const nearCapacity = teamSizes.filter(t => t.capacity > 0 && t.size / t.capacity > 0.8);

                          if (underutilized.length > 0) {
                            recommendations.push({
                              type: 'balance',
                              message: `Consider consolidating ${underutilized.length} underutilized teams or reducing their capacity`,
                              action: 'Rebalance Teams'
                            });
                          }

                          if (nearCapacity.length > 0 && underutilized.length > 0) {
                            recommendations.push({
                              type: 'redistribute',
                              message: `Redistribute members from ${nearCapacity.length} full teams to ${underutilized.length} underutilized teams`,
                              action: 'Auto-Suggest Moves'
                            });
                          }
                        }

                        // Suggest branch-team alignment
                        if (Array.isArray(branches) && Array.isArray(teams)) {
                          const unassignedTeams = teams.filter(team => !team.branchId);
                          if (unassignedTeams.length > 0 && branches.length > 0) {
                            recommendations.push({
                              type: 'alignment',
                              message: `${unassignedTeams.length} teams not assigned to branches - consider organizational alignment`,
                              action: 'Assign to Branches'
                            });
                          }
                        }

                        return recommendations.length > 0 ? (
                          recommendations.map((rec, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-blue-100 rounded">
                              <div className="flex items-center gap-2 text-sm text-blue-800">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                {rec.message}
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-6 text-xs bg-white"
                                onClick={() => {
                                  // Future implementation for auto-suggestions
                                  console.log(`Triggered: ${rec.action}`);
                                }}
                              >
                                {rec.action}
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-blue-800 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            Your team organization is optimally structured
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Team Performance Matrix */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team Performance Matrix
                      {isOptimizedView && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          Optimized View
                        </Badge>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(isOptimizedView ? teams.slice(0, 3) : teams.slice(0, 6)).map((team: any) => {
                        const teamMembers = Array.isArray(employees) ? employees.filter(emp => emp.teamId === team.id) : [];
                        const utilization = (team.maxMembers || 0) > 0 ? teamMembers.length / team.maxMembers : 0;
                        const hasLead = teamMembers.some(emp => emp.hierarchyRole === 'team_lead');
                        
                        return (
                          <div key={team.id} className="p-3 bg-white rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-sm">{team.name}</h5>
                              <div className={`w-2 h-2 rounded-full ${team.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Capacity:</span>
                                <span className={utilization > 0.9 ? 'text-red-600' : utilization > 0.7 ? 'text-yellow-600' : 'text-green-600'}>
                                  {Math.round(utilization * 100)}%
                                </span>
                              </div>
                              {!isOptimizedView && (
                                <>
                                  <div className="flex justify-between text-xs">
                                    <span>Leadership:</span>
                                    <span className={hasLead ? 'text-green-600' : 'text-red-600'}>
                                      {hasLead ? 'Assigned' : 'Missing'}
                                    </span>
                                  </div>
                                  <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${utilization > 0.9 ? 'bg-red-500' : utilization > 0.7 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                      style={{ width: `${Math.min(utilization * 100, 100)}%` }}
                                    ></div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        Showing {isOptimizedView ? Math.min(3, teams.length) : Math.min(6, teams.length)} of {teams.length} teams
                      </p>
                      {teams.length > (isOptimizedView ? 3 : 6) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsOptimizedView(!isOptimizedView)}
                          className="text-xs"
                        >
                          {isOptimizedView ? 'Show More Details' : 'Optimize View'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>Create teams first to see optimization insights and conflict detection.</p>
                </div>
              )}
            </CardContent>
          </Card>

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

        {/* Manager Accounts Tab */}
        <TabsContent value="managers" className="space-y-4">
          {/* Manager Account Correlation Matrix */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-600" />
                Manager Control Matrix
              </CardTitle>
              <CardDescription>
                Visual mapping of manager permissions and organizational unit control relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(employees) && employees.filter(emp => ['company_admin', 'branch_manager', 'team_lead'].includes(emp.hierarchyRole)).length > 0 ? (
                <div className="space-y-6">
                  {/* Permission Scope Visualization */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Manager Hierarchy */}
                    <div className="p-4 border rounded-lg bg-purple-50">
                      <h4 className="font-medium text-purple-900 mb-4 flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Management Hierarchy & Scope
                      </h4>
                      <div className="space-y-4">
                        {/* Company Admins */}
                        {Array.isArray(employees) && employees.filter(emp => emp.hierarchyRole === 'company_admin').map((admin: any) => (
                          <div key={admin.id} className="p-3 bg-yellow-100 rounded-lg border-l-4 border-yellow-500">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Crown className="h-5 w-5 text-yellow-600" />
                                <div>
                                  <p className="font-medium text-yellow-900">{admin.firstName} {admin.lastName}</p>
                                  <p className="text-xs text-yellow-700">Company Administrator</p>
                                </div>
                              </div>
                              <Badge className="bg-yellow-200 text-yellow-800">
                                Full Access
                              </Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs bg-white">
                                All Branches ({Array.isArray(branches) ? branches.length : 0})
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-white">
                                All Teams ({Array.isArray(teams) ? teams.length : 0})
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-white">
                                All Employees ({Array.isArray(employees) ? employees.length : 0})
                              </Badge>
                            </div>
                          </div>
                        ))}

                        {/* Branch Managers */}
                        {Array.isArray(employees) && employees.filter(emp => emp.hierarchyRole === 'branch_manager').map((manager: any) => {
                          const managerBranch = Array.isArray(branches) ? branches.find(b => b.id === manager.branchId) : null;
                          const branchTeams = Array.isArray(teams) ? teams.filter(team => team.branchId === manager.branchId) : [];
                          const branchEmployees = Array.isArray(employees) ? employees.filter(emp => emp.branchId === manager.branchId) : [];

                          return (
                            <div key={manager.id} className="p-3 bg-blue-100 rounded-lg border-l-4 border-blue-500 ml-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Building2 className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <p className="font-medium text-blue-900">{manager.firstName} {manager.lastName}</p>
                                    <p className="text-xs text-blue-700">Branch Manager - {managerBranch?.name || 'Unassigned'}</p>
                                  </div>
                                </div>
                                <Badge className="bg-blue-200 text-blue-800">
                                  Branch Level
                                </Badge>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs bg-white">
                                  {branchTeams.length} Teams
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-white">
                                  {branchEmployees.length} Staff
                                </Badge>
                                {managerBranch && (
                                  <Badge variant="outline" className="text-xs bg-white">
                                    {managerBranch.location}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Team Leads */}
                        {Array.isArray(employees) && employees.filter(emp => emp.hierarchyRole === 'team_lead').map((lead: any) => {
                          const leadTeam = Array.isArray(teams) ? teams.find(t => t.id === lead.teamId) : null;
                          const teamMembers = Array.isArray(employees) ? employees.filter(emp => emp.teamId === lead.teamId) : [];
                          const leadBranch = Array.isArray(branches) ? branches.find(b => b.id === lead.branchId) : null;

                          return (
                            <div key={lead.id} className="p-3 bg-green-100 rounded-lg border-l-4 border-green-500 ml-8">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Users className="h-4 w-4 text-green-600" />
                                  <div>
                                    <p className="font-medium text-green-900">{lead.firstName} {lead.lastName}</p>
                                    <p className="text-xs text-green-700">
                                      Team Lead - {leadTeam?.name || 'Unassigned'} 
                                      {leadBranch && ` (${leadBranch.name})`}
                                    </p>
                                  </div>
                                </div>
                                <Badge className="bg-green-200 text-green-800">
                                  Team Level
                                </Badge>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs bg-white">
                                  {teamMembers.length - 1} Direct Reports
                                </Badge>
                                {leadTeam && (
                                  <Badge variant="outline" className="text-xs bg-white">
                                    Max {leadTeam.maxMembers} capacity
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Permission Matrix */}
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Access Control Matrix
                      </h4>
                      <div className="space-y-4">
                        {/* Matrix Header */}
                        <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 border-b pb-2">
                          <div>Permission</div>
                          <div>Admin</div>
                          <div>Branch Mgr</div>
                          <div>Team Lead</div>
                        </div>

                        {/* Permission Rows */}
                        {[
                          { name: 'Create Branches', admin: true, branch: false, team: false },
                          { name: 'Manage Teams', admin: true, branch: true, team: false },
                          { name: 'Hire/Fire Staff', admin: true, branch: true, team: false },
                          { name: 'Assign Roles', admin: true, branch: true, team: true },
                          { name: 'Verify Work', admin: true, branch: true, team: true },
                          { name: 'View Reports', admin: true, branch: true, team: true },
                          { name: 'Manage Invites', admin: true, branch: true, team: false },
                          { name: 'Edit Structure', admin: true, branch: false, team: false }
                        ].map((permission, index) => (
                          <div key={index} className="grid grid-cols-4 gap-2 items-center py-1">
                            <div className="text-xs text-gray-700">{permission.name}</div>
                            <div className="flex justify-center">
                              {permission.admin ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <X className="h-3 w-3 text-red-400" />
                              )}
                            </div>
                            <div className="flex justify-center">
                              {permission.branch ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <X className="h-3 w-3 text-red-400" />
                              )}
                            </div>
                            <div className="flex justify-center">
                              {permission.team ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <X className="h-3 w-3 text-red-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Access Control Visualization */}
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-red-50 to-orange-50">
                    <h4 className="font-medium text-red-900 mb-4 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Security Boundary Visualization
                    </h4>
                    <div className="space-y-4">
                      {/* Permission Scope Map */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Data Access Boundaries */}
                        <div className="space-y-4">
                          <h5 className="font-medium text-sm text-red-800 mb-3">Data Access Boundaries</h5>
                          
                          {/* Company Admin Boundary */}
                          <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Crown className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium text-yellow-900">Company Administrator Scope</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>All employee data</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>Financial information</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>Performance reviews</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>Work diary entries</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>System settings</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>Audit logs</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Branch Manager Boundary */}
                          <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded-lg ml-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-900">Branch Manager Scope</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>Branch employee data</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>Team performance</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <X className="h-3 w-3 text-red-500" />
                                  <span>Other branch data</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>Branch work entries</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <X className="h-3 w-3 text-red-500" />
                                  <span>System settings</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <X className="h-3 w-3 text-red-500" />
                                  <span>Financial reports</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Team Lead Boundary */}
                          <div className="p-3 bg-green-50 border-2 border-green-300 rounded-lg ml-8">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-900">Team Lead Scope</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>Team member data</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>Work verification</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <X className="h-3 w-3 text-red-500" />
                                  <span>Other team data</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span>Team work entries</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <X className="h-3 w-3 text-red-500" />
                                  <span>HR functions</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <X className="h-3 w-3 text-red-500" />
                                  <span>Branch operations</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Boundaries */}
                        <div className="space-y-4">
                          <h5 className="font-medium text-sm text-red-800 mb-3">Action Boundaries & Restrictions</h5>
                          
                          {/* Critical Actions */}
                          <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                            <h6 className="font-medium text-red-900 text-xs mb-2 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              High-Risk Actions (Admin Only)
                            </h6>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-1 text-red-800">
                                <Lock className="h-2 w-2" />
                                <span>Delete company data</span>
                              </div>
                              <div className="flex items-center gap-1 text-red-800">
                                <Lock className="h-2 w-2" />
                                <span>Modify payment settings</span>
                              </div>
                              <div className="flex items-center gap-1 text-red-800">
                                <Lock className="h-2 w-2" />
                                <span>Access audit logs</span>
                              </div>
                            </div>
                          </div>

                          {/* Moderate Actions */}
                          <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                            <h6 className="font-medium text-yellow-900 text-xs mb-2 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Moderate Actions (Manager+)
                            </h6>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-1 text-yellow-800">
                                <Key className="h-2 w-2" />
                                <span>Hire/terminate employees</span>
                              </div>
                              <div className="flex items-center gap-1 text-yellow-800">
                                <Key className="h-2 w-2" />
                                <span>Modify team structure</span>
                              </div>
                              <div className="flex items-center gap-1 text-yellow-800">
                                <Key className="h-2 w-2" />
                                <span>Access performance data</span>
                              </div>
                            </div>
                          </div>

                          {/* Standard Actions */}
                          <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                            <h6 className="font-medium text-green-900 text-xs mb-2 flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Standard Actions (All Roles)
                            </h6>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-1 text-green-800">
                                <CheckCircle className="h-2 w-2" />
                                <span>Verify work entries</span>
                              </div>
                              <div className="flex items-center gap-1 text-green-800">
                                <CheckCircle className="h-2 w-2" />
                                <span>View assigned reports</span>
                              </div>
                              <div className="flex items-center gap-1 text-green-800">
                                <CheckCircle className="h-2 w-2" />
                                <span>Update employee roles</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Security Heat Map */}
                      <div className="p-3 bg-white border rounded-lg">
                        <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-purple-600" />
                          Permission Distribution Heat Map
                        </h6>
                        <div className="grid grid-cols-8 gap-1">
                          {[
                            'Create', 'Read', 'Update', 'Delete', 'Approve', 'Assign', 'Report', 'Configure'
                          ].map((action, actionIndex) => (
                            <div key={actionIndex} className="text-center">
                              <div className="text-xs font-medium text-gray-600 mb-1">{action}</div>
                              <div className="space-y-1">
                                {/* Admin row */}
                                <div className={`h-3 rounded ${actionIndex < 6 || actionIndex === 7 ? 'bg-red-500' : 'bg-red-300'}`} title="Company Admin"></div>
                                {/* Branch Manager row */}
                                <div className={`h-3 rounded ${actionIndex < 5 ? 'bg-yellow-500' : actionIndex < 7 ? 'bg-yellow-300' : 'bg-gray-200'}`} title="Branch Manager"></div>
                                {/* Team Lead row */}
                                <div className={`h-3 rounded ${actionIndex < 3 || actionIndex === 4 || actionIndex === 6 ? 'bg-green-500' : 'bg-gray-200'}`} title="Team Lead"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span>Admin</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                            <span>Branch Mgr</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Team Lead</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-200 rounded"></div>
                            <span>No Access</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manager Workload Distribution */}
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                    <h4 className="font-medium text-indigo-900 mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Manager Workload Analysis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Company Level */}
                      <div className="p-3 bg-white rounded border">
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <Crown className="h-3 w-3 text-yellow-600" />
                          Company Level
                        </h5>
                        <div className="space-y-2">
                          {Array.isArray(employees) && employees.filter(emp => emp.hierarchyRole === 'company_admin').length > 0 ? (
                            employees.filter(emp => emp.hierarchyRole === 'company_admin').map((admin: any) => (
                              <div key={admin.id} className="flex justify-between items-center text-xs">
                                <span>{admin.firstName} {admin.lastName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {Array.isArray(employees) ? employees.length : 0} reports
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500">No company administrators</p>
                          )}
                        </div>
                      </div>

                      {/* Branch Level */}
                      <div className="p-3 bg-white rounded border">
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-blue-600" />
                          Branch Level
                        </h5>
                        <div className="space-y-2">
                          {Array.isArray(employees) && employees.filter(emp => emp.hierarchyRole === 'branch_manager').length > 0 ? (
                            employees.filter(emp => emp.hierarchyRole === 'branch_manager').map((manager: any) => {
                              const directReports = Array.isArray(employees) ? employees.filter(emp => emp.branchId === manager.branchId && emp.id !== manager.id) : [];
                              return (
                                <div key={manager.id} className="flex justify-between items-center text-xs">
                                  <span>{manager.firstName} {manager.lastName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {directReports.length} reports
                                  </Badge>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-gray-500">No branch managers</p>
                          )}
                        </div>
                      </div>

                      {/* Team Level */}
                      <div className="p-3 bg-white rounded border">
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <Users className="h-3 w-3 text-green-600" />
                          Team Level
                        </h5>
                        <div className="space-y-2">
                          {Array.isArray(employees) && employees.filter(emp => emp.hierarchyRole === 'team_lead').length > 0 ? (
                            employees.filter(emp => emp.hierarchyRole === 'team_lead').slice(0, 4).map((lead: any) => {
                              const teamMembers = Array.isArray(employees) ? employees.filter(emp => emp.teamId === lead.teamId && emp.id !== lead.id) : [];
                              return (
                                <div key={lead.id} className="flex justify-between items-center text-xs">
                                  <span>{lead.firstName} {lead.lastName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {teamMembers.length} reports
                                  </Badge>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-gray-500">No team leads</p>
                          )}
                          {Array.isArray(employees) && employees.filter(emp => emp.hierarchyRole === 'team_lead').length > 4 && (
                            <p className="text-xs text-gray-500">+{employees.filter(emp => emp.hierarchyRole === 'team_lead').length - 4} more leads</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Crown className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Managers Assigned</h3>
                  <p className="text-gray-600 mb-4">
                    Assign employees to management roles to see the control matrix and permission scope.
                  </p>
                  <Button onClick={() => {
                    setSelectedEmployee(null);
                    setIsManageEmployeeOpen(true);
                  }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Manager Roles
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="manager-accounts-management">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    Manager Account Management
                  </CardTitle>
                  <CardDescription>
                    Create and manage manager sub-accounts with login credentials and permissions
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setIsCreateManagerOpen(true)}
                  data-testid="button-create-manager"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Manager Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {Array.isArray(employees) && employees.filter((emp: any) => emp.hierarchyRole !== 'employee').length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees.filter((emp: any) => emp.hierarchyRole !== 'employee').map((manager: any) => (
                      <Card key={manager.id} className="p-4 border border-indigo-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              {getRoleIcon(manager.hierarchyRole || 'employee')}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{manager.firstName} {manager.lastName}</h4>
                              <p className="text-xs text-gray-600">{manager.hierarchyRole?.replace('_', ' ') || 'Employee'}</p>
                            </div>
                          </div>
                          <Badge className={getRoleBadgeColor(manager.hierarchyRole || 'employee')}>
                            {manager.hierarchyRole === 'company_admin' ? 'Admin' :
                             manager.hierarchyRole === 'branch_manager' ? 'Manager' :
                             manager.hierarchyRole === 'team_lead' ? 'Lead' : 'Employee'}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span>Login Access:</span>
                            <span className={manager.canLogin !== false ? 'text-green-600' : 'text-red-600'}>
                              {manager.canLogin !== false ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Verification:</span>
                            <span className={manager.canVerifyWork ? 'text-green-600' : 'text-gray-500'}>
                              {manager.canVerifyWork ? (manager.verificationScope || 'Team') : 'None'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Permissions:</span>
                            <div className="flex gap-1">
                              {manager.canManageEmployees && <Badge variant="outline" className="text-xs">Manage</Badge>}
                              {manager.canCreateTeams && <Badge variant="outline" className="text-xs">Create</Badge>}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8" data-testid="managers-empty-state">
                  <ShieldCheck className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Manager Accounts</h3>
                  <p className="text-gray-600 mb-4">
                    Create manager sub-accounts with login credentials and specialized permissions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Create Manager Account Dialog - Step-by-Step Process */}
      <Dialog open={isCreateManagerOpen} onOpenChange={(open) => {
        setIsCreateManagerOpen(open);
        if (!open) resetManagerForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-gradient-to-br from-white to-gray-50">
          <DialogHeader className="flex-shrink-0 pb-4 border-b border-gray-100">
            <DialogTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              Create Manager Account - Step {managerCreationStep} of 4
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Follow the guided process to promote an employee to a management role with specialized login credentials
            </DialogDescription>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mt-4 px-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step === managerCreationStep 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : step < managerCreationStep 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {step < managerCreationStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step
                    )}
                  </div>
                  <div className="ml-2 text-xs">
                    <div className={`font-medium ${
                      step === managerCreationStep ? 'text-blue-600' : 
                      step < managerCreationStep ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {step === 1 && 'Select Employee'}
                      {step === 2 && 'Login Setup'}
                      {step === 3 && 'Permissions'}
                      {step === 4 && 'Review'}
                    </div>
                  </div>
                  {step < 4 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      step < managerCreationStep ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </DialogHeader>
          
          <div className="space-y-6 overflow-y-auto flex-1 pr-2 pt-4">
            {/* Step 1: Employee Selection */}
            {managerCreationStep === 1 && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Step 1: Employee Selection</h3>
                  <p className="text-blue-700 text-sm">
                    Choose an eligible employee to promote to a management role. Only active employees without existing management roles are shown.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manager-employee" className="text-base font-semibold">Select Employee</Label>
                    {Array.isArray(employees) && employees.length > 0 && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        {employees.filter((emp: any) => {
                          const isRegularEmployee = emp.hierarchyRole === 'employee' || !emp.hierarchyRole;
                          const isActive = emp.employmentStatus === 'active' || !emp.employmentStatus;
                          const notCompanyOwner = emp.id !== employees.find((e: any) => e.isCompanyOwner)?.id;
                          return isRegularEmployee && isActive && notCompanyOwner;
                        }).length} Eligible
                      </Badge>
                    )}
                  </div>
              
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search employees by name, position, or department..."
                          value={employeeSearchQuery}
                          onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                          className="pl-9 h-10"
                          data-testid="input-employee-search"
                        />
                        {employeeSearchQuery && (
                      <button
                        onClick={() => setEmployeeSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        data-testid="button-clear-search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                    <SelectTrigger className="w-36 h-10">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      <SelectItem value="recent">Recent Hires</SelectItem>
                      <SelectItem value="senior">Senior Staff</SelectItem>
                      <SelectItem value="department">Has Department</SelectItem>
                    </SelectContent>
                  </Select>
                  {(employeeSearchQuery || employeeFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEmployeeSearchQuery('');
                        setEmployeeFilter('all');
                      }}
                      className="h-10 px-3"
                      data-testid="button-reset-filters"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                
                {/* Search Results Indicator */}
                {(employeeSearchQuery || employeeFilter !== 'all') && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Filter className="h-4 w-4" />
                    <span>
                      Showing {Array.isArray(employees) ? employees.filter((emp: any) => {
                        const isRegularEmployee = emp.hierarchyRole === 'employee' || !emp.hierarchyRole;
                        const isActive = emp.employmentStatus === 'active' || !emp.employmentStatus;
                        const notCompanyOwner = emp.id !== employees.find((e: any) => e.isCompanyOwner)?.id;
                        
                        if (!isRegularEmployee || !isActive || !notCompanyOwner) return false;
                        
                        if (employeeSearchQuery) {
                          const query = employeeSearchQuery.toLowerCase();
                          const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
                          const position = (emp.position || '').toLowerCase();
                          const department = (emp.department || '').toLowerCase();
                          const email = (emp.email || '').toLowerCase();
                          
                          if (!fullName.includes(query) && 
                              !position.includes(query) && 
                              !department.includes(query) && 
                              !email.includes(query)) {
                            return false;
                          }
                        }
                        
                        if (employeeFilter === 'recent') {
                          const joinDate = emp.dateJoined ? new Date(emp.dateJoined) : null;
                          const threeMonthsAgo = new Date();
                          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                          return joinDate && joinDate > threeMonthsAgo;
                        }
                        
                        if (employeeFilter === 'senior') {
                          const joinDate = emp.dateJoined ? new Date(emp.dateJoined) : null;
                          const oneYearAgo = new Date();
                          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                          return joinDate && joinDate < oneYearAgo;
                        }
                        
                        if (employeeFilter === 'department') {
                          return emp.department && emp.department !== 'General';
                        }
                        
                        return true;
                      }).length : 0} of {Array.isArray(employees) ? employees.filter((emp: any) => {
                        const isRegularEmployee = emp.hierarchyRole === 'employee' || !emp.hierarchyRole;
                        const isActive = emp.employmentStatus === 'active' || !emp.employmentStatus;
                        const notCompanyOwner = emp.id !== employees.find((e: any) => e.isCompanyOwner)?.id;
                        return isRegularEmployee && isActive && notCompanyOwner;
                      }).length : 0} eligible employees
                    </span>
                    {employeeSearchQuery && (
                      <Badge variant="secondary" className="text-xs">
                        Search: "{employeeSearchQuery}"
                      </Badge>
                    )}
                    {employeeFilter !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Filter: {employeeFilter.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <Select 
                value={newManager.employeeId} 
                onValueChange={(value) => {
                  const selectedEmployee = Array.isArray(employees) ? employees.find((emp: any) => emp.id === value) : undefined;
                  if (selectedEmployee) {
                    // Auto-generate username suggestion
                    const suggestedUsername = `${selectedEmployee.firstName?.toLowerCase() || 'manager'}.${selectedEmployee.lastName?.toLowerCase() || 'user'}`;
                    setNewManager({ 
                      ...newManager, 
                      employeeId: value,
                      username: suggestedUsername
                    });
                  } else {
                    setNewManager({ ...newManager, employeeId: value });
                  }
                }}
              >
                <SelectTrigger data-testid="select-manager-employee" className="h-12">
                  <SelectValue placeholder="🔍 Choose an employee to promote to manager">
                    {newManager.employeeId && Array.isArray(employees) && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                          {(() => {
                            const emp = employees.find((e: any) => e.id === newManager.employeeId);
                            return emp ? `${(emp.firstName?.[0] || 'E').toUpperCase()}${(emp.lastName?.[0] || 'M').toUpperCase()}` : 'EM';
                          })()}
                        </div>
                        <span className="font-medium">
                          {(() => {
                            const emp = employees.find((e: any) => e.id === newManager.employeeId);
                            return emp ? `${emp.firstName} ${emp.lastName}` : 'Selected Employee';
                          })()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {(() => {
                            const emp = employees.find((e: any) => e.id === newManager.employeeId);
                            return emp?.position || 'Employee';
                          })()}
                        </Badge>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-80 overflow-y-auto">
                  {Array.isArray(employees) && employees.length > 0 ? (
                    employees
                      .filter((emp: any) => {
                        // Smart filtering for eligible employees
                        const isRegularEmployee = emp.hierarchyRole === 'employee' || !emp.hierarchyRole;
                        const isActive = emp.employmentStatus === 'active' || !emp.employmentStatus;
                        const notCompanyOwner = emp.id !== employees.find((e: any) => e.isCompanyOwner)?.id;
                        
                        // Basic eligibility check
                        if (!isRegularEmployee || !isActive || !notCompanyOwner) return false;
                        
                        // Search query filter
                        if (employeeSearchQuery) {
                          const query = employeeSearchQuery.toLowerCase();
                          const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
                          const position = (emp.position || '').toLowerCase();
                          const department = (emp.department || '').toLowerCase();
                          const email = (emp.email || '').toLowerCase();
                          
                          if (!fullName.includes(query) && 
                              !position.includes(query) && 
                              !department.includes(query) && 
                              !email.includes(query)) {
                            return false;
                          }
                        }
                        
                        // Filter by category
                        if (employeeFilter === 'recent') {
                          const joinDate = emp.dateJoined ? new Date(emp.dateJoined) : null;
                          const threeMonthsAgo = new Date();
                          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                          return joinDate && joinDate > threeMonthsAgo;
                        }
                        
                        if (employeeFilter === 'senior') {
                          const joinDate = emp.dateJoined ? new Date(emp.dateJoined) : null;
                          const oneYearAgo = new Date();
                          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                          return joinDate && joinDate < oneYearAgo;
                        }
                        
                        if (employeeFilter === 'department') {
                          return emp.department && emp.department !== 'General';
                        }
                        
                        return true;
                      })
                      .map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {/* Enhanced Employee Card */}
                          <div className="p-3 border border-gray-200 rounded-lg bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md">
                            <div className="flex items-start gap-3">
                              {/* Profile Photo Section */}
                              <div className="flex-shrink-0">
                                <div className="relative">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                    {(employee.firstName?.[0] || 'E').toUpperCase()}{(employee.lastName?.[0] || 'M').toUpperCase()}
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <CheckCircle className="h-2.5 w-2.5 text-white" />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Employee Details */}
                              <div className="flex-1 min-w-0">
                                {/* Name and Position */}
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-bold text-gray-900 text-sm truncate">
                                    {employee.firstName} {employee.lastName}
                                  </h4>
                                  <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 text-blue-800 border-blue-300 font-semibold">
                                    {employee.position || 'Employee'}
                                  </Badge>
                                </div>
                                
                                {/* Department and ID */}
                                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <Building2 className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="font-medium truncate">{employee.department || 'General'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <User className="h-3.5 w-3.5 text-purple-500" />
                                    <span className="font-mono text-xs">ID: {employee.employeeId || 'N/A'}</span>
                                  </div>
                                </div>
                                
                                {/* Contact and Join Date */}
                                <div className="grid grid-cols-1 gap-1.5 mb-2 text-xs">
                                  {employee.email && (
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                      <Mail className="h-3.5 w-3.5 text-green-500" />
                                      <span className="truncate font-medium">{employee.email}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <Calendar className="h-3.5 w-3.5 text-orange-500" />
                                    <span className="font-medium">
                                      Joined: {employee.dateJoined ? new Date(employee.dateJoined).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric' 
                                      }) : 'Date not available'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Status and Eligibility */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-300">
                                      ✓ Active
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                      💼 {employee.employmentType || 'Full-time'}
                                    </Badge>
                                  </div>
                                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300 font-semibold px-2">
                                    🎯 Eligible for Promotion
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="none" disabled>
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <div className="font-semibold text-gray-700 mb-1">No Employees Available</div>
                        <div className="text-xs text-gray-500">
                          All eligible employees may already have manager accounts
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          or no employees meet the promotion criteria
                        </div>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Login Credentials */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Login Credentials
              </h4>
              
              <div>
                <Label htmlFor="manager-username">Manager Username</Label>
                <Input
                  id="manager-username"
                  type="text"
                  value={newManager.username}
                  onChange={(e) => setNewManager({ ...newManager, username: e.target.value })}
                  placeholder="manager.username"
                  data-testid="input-manager-username"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newManager.employeeId 
                    ? "Auto-generated from employee name (you can edit this)"
                    : "Unique username for manager login system"
                  }
                </p>
              </div>

              <div>
                <Label htmlFor="manager-password">Password</Label>
                <Input
                  id="manager-password"
                  type="password"
                  value={newManager.password}
                  onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                  placeholder="••••••••••"
                  data-testid="input-manager-password"
                />
              </div>

              <div>
                <Label htmlFor="manager-confirm-password">Confirm Password</Label>
                <Input
                  id="manager-confirm-password"
                  type="password"
                  value={newManager.confirmPassword}
                  onChange={(e) => setNewManager({ ...newManager, confirmPassword: e.target.value })}
                  placeholder="••••••••••"
                  data-testid="input-manager-confirm-password"
                />
              </div>
            </div>

            {/* Access Level */}
            <div className="space-y-3">
              <Label htmlFor="access-level">Access Level</Label>
              <Select 
                value={newManager.accessLevel} 
                onValueChange={(value) => setNewManager({ ...newManager, accessLevel: value })}
              >
                <SelectTrigger data-testid="select-access-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_lead">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">Team Lead</div>
                        <div className="text-xs text-gray-500">Manage specific team members</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="branch_manager">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">Branch Manager</div>
                        <div className="text-xs text-gray-500">Manage entire branch operations</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="company_admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <div>
                        <div className="font-medium">Company Admin</div>
                        <div className="text-xs text-gray-500">Full company access</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permissions */}
            <div className="p-4 bg-indigo-50 rounded-lg space-y-4">
              <h4 className="font-medium text-indigo-900 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manager Permissions
              </h4>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="can-manage-employees" className="text-sm font-medium">
                      Manage Employees
                    </Label>
                    <p className="text-xs text-gray-600">Edit employee roles and assignments</p>
                  </div>
                  <Switch
                    id="can-manage-employees"
                    checked={newManager.permissions.canManageEmployees}
                    onCheckedChange={(checked) => 
                      setNewManager({ 
                        ...newManager, 
                        permissions: { ...newManager.permissions, canManageEmployees: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="can-create-teams" className="text-sm font-medium">
                      Create Teams
                    </Label>
                    <p className="text-xs text-gray-600">Add new teams and organizational units</p>
                  </div>
                  <Switch
                    id="can-create-teams"
                    checked={newManager.permissions.canCreateTeams}
                    onCheckedChange={(checked) => 
                      setNewManager({ 
                        ...newManager, 
                        permissions: { ...newManager.permissions, canCreateTeams: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="can-verify-work" className="text-sm font-medium">
                      Verify Work
                    </Label>
                    <p className="text-xs text-gray-600">Approve and verify work entries</p>
                  </div>
                  <Switch
                    id="can-verify-work"
                    checked={newManager.permissions.canVerifyWork}
                    onCheckedChange={(checked) => 
                      setNewManager({ 
                        ...newManager, 
                        permissions: { ...newManager.permissions, canVerifyWork: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="can-view-reports" className="text-sm font-medium">
                      View Reports
                    </Label>
                    <p className="text-xs text-gray-600">Access analytics and performance reports</p>
                  </div>
                  <Switch
                    id="can-view-reports"
                    checked={newManager.permissions.canViewReports}
                    onCheckedChange={(checked) => 
                      setNewManager({ 
                        ...newManager, 
                        permissions: { ...newManager.permissions, canViewReports: checked }
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Account Summary */}
            {newManager.employeeId && newManager.username && newManager.password && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <h5 className="font-medium text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Manager Account Summary
                </h5>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-2">
                    <div className="flex flex-col">
                      <span className="text-gray-500">Employee</span>
                      <span className="font-medium text-gray-900">
                        {employees?.find((e: any) => e.id === newManager.employeeId)?.firstName} {employees?.find((e: any) => e.id === newManager.employeeId)?.lastName}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Position</span>
                      <span className="font-medium text-gray-900">
                        {employees?.find((e: any) => e.id === newManager.employeeId)?.position || 'Employee'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-col">
                      <span className="text-gray-500">Username</span>
                      <span className="font-medium text-gray-900">{newManager.username}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Access Level</span>
                      <span className="font-medium text-gray-900">{newManager.accessLevel.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Password Status</span>
                    <span className={`font-medium ${newManager.password === newManager.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                      {newManager.password === newManager.confirmPassword ? '✓ Passwords Match' : '✗ Passwords Don\'t Match'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-500">Permissions</span>
                    <span className="font-medium text-blue-600">
                      {Object.values(newManager.permissions).filter(Boolean).length} of 4 enabled
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
          
          {/* Step Navigation and Action Buttons */}
          <div className="flex gap-3 pt-4 border-t bg-white flex-shrink-0">
            <Button 
              onClick={() => {
                if (!newManager.employeeId) {
                  toast({ title: "Error", description: "Please select an employee", variant: "destructive" });
                  return;
                }
                if (!newManager.username) {
                  toast({ title: "Error", description: "Please enter a username", variant: "destructive" });
                  return;
                }
                if (!newManager.password) {
                  toast({ title: "Error", description: "Please enter a password", variant: "destructive" });
                  return;
                }
                if (newManager.password !== newManager.confirmPassword) {
                  toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
                  return;
                }
                createManagerMutation.mutate(newManager);
              }}
              disabled={createManagerMutation.isPending}
              className="flex-1"
              data-testid="button-create-manager-account"
            >
              {createManagerMutation.isPending ? "Creating Account..." : "Create Manager Account"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateManagerOpen(false)}
              className="flex-1"
              data-testid="button-cancel-manager-account"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                    disabled={!employeeUpdate.branchId && Array.isArray(teams) && teams.filter((t: any) => !t.branchId).length === 0}
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

      {/* Edit Branch Dialog */}
      <Dialog open={isEditBranchOpen} onOpenChange={setIsEditBranchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch information and settings
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
                  <li>• Reassign all branch employees to headquarters</li>
                  <li>• Delete all teams within this branch</li>
                  <li>• Remove all branch-specific permissions and assignments</li>
                  <li>• Archive all branch-related work entries and data</li>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team information and settings
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
                    <SelectItem value="no_lead">No lead assigned</SelectItem>
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
                    disabled={!employeeUpdate.branchId || employeeUpdate.branchId === "headquarters"}
                  >
                    <SelectTrigger data-testid="select-employee-team">
                      <SelectValue placeholder="Select team (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_team">No Team</SelectItem>
                      {Array.isArray(teams) && teams
                        .filter((team: any) => 
                          team.id && team.id.trim() !== "" && 
                          (team.branchId === employeeUpdate.branchId || (!team.branchId && employeeUpdate.branchId === "headquarters"))
                        )
                        .map((team: any) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!employeeUpdate.branchId || employeeUpdate.branchId === "headquarters") && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Assign to a branch first to select teams
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="employee-hierarchy-role">Hierarchy Role</Label>
                  <Select value={employeeUpdate.hierarchyRole} onValueChange={(value) => setEmployeeUpdate({ ...employeeUpdate, hierarchyRole: value })}>
                    <SelectTrigger data-testid="select-employee-hierarchy-role">
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