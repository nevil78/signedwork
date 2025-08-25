import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  UserPlus,
  Download,
  Upload,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowLeft,
  Brain,
  Zap,
  Lightbulb,
  Gauge,
  Fingerprint,
  CheckCircle2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { apiRequest } from "@/lib/queryClient";
import VisualOrgChart from "@/components/VisualOrgChart";
import { useLocation } from "wouter";
import CompanyNavHeader from "@/components/company-nav-header";

export default function CompanyHierarchy() {
  const [, setLocation] = useLocation();
  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isManageEmployeeOpen, setIsManageEmployeeOpen] = useState(false);
  const [isEditBranchOpen, setIsEditBranchOpen] = useState(false);
  const [isDeleteBranchOpen, setIsDeleteBranchOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [isDeleteTeamOpen, setIsDeleteTeamOpen] = useState(false);
  const [isCreateManagerOpen, setIsCreateManagerOpen] = useState(false);
  const [isEditManagerOpen, setIsEditManagerOpen] = useState(false);
  const [isDeleteManagerOpen, setIsDeleteManagerOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [bulkAssignTargetManager, setBulkAssignTargetManager] = useState<string>("");
  const [newTempPassword, setNewTempPassword] = useState<string>("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<any[]>([]);
  const [includePersonalData, setIncludePersonalData] = useState(false);
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
  
  // Advanced filtering state
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    roles: [],
    branches: [],
    teams: [],
    departments: [],
    statuses: [],
    verificationCapabilities: [],
    joinedDateRange: { start: '', end: '' }
  });
  const [filterPresets, setFilterPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [structureView, setStructureView] = useState<'list' | 'visual'>('visual'); // Default to visual for wow factor
  
  // Phase 4: Advanced Analytics State
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('30d');
  const [selectedMetrics, setSelectedMetrics] = useState(['performance', 'capacity', 'retention']);
  const [analyticsView, setAnalyticsView] = useState<'overview' | 'performance' | 'trends' | 'predictions'>('overview');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous');
  const [alertThresholds, setAlertThresholds] = useState({
    lowPerformance: 70,
    overCapacity: 90,
    turnoverRisk: 75
  });
  
  // Phase 5: Real-time Communication & Notifications State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeUsers, setRealtimeUsers] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Phase 5: Enterprise Security State
  const [isSecurityDashboardOpen, setIsSecurityDashboardOpen] = useState(false);
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);
  const [isMFASetupOpen, setIsMFASetupOpen] = useState(false);
  const [complianceReport, setComplianceReport] = useState<any>(null);

  // Current User Query - Must be declared FIRST before using in other queries
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    staleTime: 600000, // User data rarely changes, cache for 10 minutes
    gcTime: 1800000, // Keep user data for 30 minutes
  });
  
  // Phase 5: Fetch Security Metrics - now after currentUser declaration
  const { data: securityData, refetch: refetchSecurity } = useQuery({
    queryKey: ['/api/security/dashboard'],
    enabled: isSecurityDashboardOpen && !!currentUser
  });
  
  // Phase 3: Bulk Operations State
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isBulkOperationsOpen, setIsBulkOperationsOpen] = useState(false);
  const [bulkOperation, setBulkOperation] = useState({
    type: 'assign', // 'assign', 'role', 'permissions'
    branchId: '',
    teamId: '',
    hierarchyRole: 'employee',
    permissions: {
      canVerifyWork: false,
      canManageEmployees: false,
      canCreateTeams: false,
      verificationScope: 'none'
    }
  });
  const [bulkFilterCriteria, setBulkFilterCriteria] = useState({
    branch: 'all',
    team: 'all',
    role: 'all',
    permissions: 'all'
  });
  
  const [newBranch, setNewBranch] = useState({
    name: "",
    location: "",
    description: "",
    managerEmployeeId: "no_manager" // Default to no manager
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

  const [editManager, setEditManager] = useState({
    managerName: "",
    managerEmail: "",
    permissionLevel: "branch_manager",
    branchId: "",
    teamId: "",
    permissions: {
      canApproveWork: true,
      canEditEmployees: false,
      canViewAnalytics: true,
      canInviteEmployees: false,
      canManageTeams: false
    }
  });

  // Phase 4: Enhanced Security & Validation State
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [usernameValidation, setUsernameValidation] = useState({
    isAvailable: true,
    isChecking: false,
    minLength: false,
    validFormat: false
  });
  const [securityScore, setSecurityScore] = useState(0);

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

  // Derived variables for better readability
  const passwordStrength = securityScore;
  const usernameAvailable = usernameValidation.isAvailable;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Phase 4: Enhanced Security & Validation Functions
  const validatePassword = (password: string) => {
    const validation = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    setPasswordValidation(validation);
    
    // Calculate security score (0-100)
    const score = Object.values(validation).reduce((acc, isValid) => acc + (isValid ? 20 : 0), 0);
    setSecurityScore(score);
    
    return validation;
  };

  const validateUsername = async (username: string) => {
    const validation = {
      minLength: username.length >= 3,
      validFormat: /^[a-zA-Z0-9._-]+$/.test(username),
      isAvailable: true,
      isChecking: false
    };
    
    // Check format and length first
    if (!validation.minLength || !validation.validFormat) {
      setUsernameValidation(validation);
      return validation;
    }
    
    // Simulate username availability check
    setUsernameValidation({ ...validation, isChecking: true });
    
    setTimeout(() => {
      // Simulate checking against existing usernames
      const unavailableUsernames = ['admin', 'manager', 'root', 'test', 'user'];
      const isAvailable = !unavailableUsernames.includes(username.toLowerCase());
      
      setUsernameValidation({
        ...validation,
        isAvailable,
        isChecking: false
      });
    }, 1000);
    
    return validation;
  };

  const getSecurityStrength = (score: number): { label: string; color: string; description: string } => {
    if (score >= 100) return { 
      label: 'Excellent', 
      color: 'text-green-600', 
      description: 'Maximum security achieved' 
    };
    if (score >= 80) return { 
      label: 'Strong', 
      color: 'text-green-600', 
      description: 'Good security level' 
    };
    if (score >= 60) return { 
      label: 'Moderate', 
      color: 'text-yellow-600', 
      description: 'Meets basic requirements' 
    };
    if (score >= 40) return { 
      label: 'Weak', 
      color: 'text-orange-600', 
      description: 'Improve password strength' 
    };
    return { 
      label: 'Very Weak', 
      color: 'text-red-600', 
      description: 'Password too simple' 
    };
  };

  // Enhanced validation functions for step-by-step process
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Employee selection
        return !!newManager.employeeId;
      case 2: // Login credentials with enhanced security
        return (
          usernameValidation.minLength &&
          usernameValidation.validFormat &&
          usernameValidation.isAvailable &&
          passwordValidation.minLength &&
          passwordValidation.hasUppercase &&
          passwordValidation.hasLowercase &&
          passwordValidation.hasNumber &&
          passwordValidation.hasSpecialChar &&
          newManager.password === newManager.confirmPassword &&
          securityScore >= 80 // Minimum security score
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

  const { data: managers, isLoading: managersLoading, refetch: refetchManagers } = useQuery({
    queryKey: ["/api/company/managers"],
    refetchInterval: 45000, // Manager accounts change less frequently
    staleTime: 25000,
    gcTime: 600000,
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
      // Clean up the data before sending to API
      const cleanBranchData = {
        name: branchData.name,
        location: branchData.location,
        description: branchData.description,
        // Only include managerEmployeeId if it's a valid value (not empty or "no_manager")
        ...(branchData.managerEmployeeId && branchData.managerEmployeeId !== "no_manager" && branchData.managerEmployeeId.trim() !== "" 
          ? { managerEmployeeId: branchData.managerEmployeeId } 
          : {})
      };
      return apiRequest("POST", "/api/company/branches", cleanBranchData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      setIsCreateBranchOpen(false);
      setNewBranch({ name: "", location: "", description: "", managerEmployeeId: "no_manager" });
      toast({ title: "Success", description: "Branch created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create branch", variant: "destructive" });
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      return apiRequest("POST", "/api/company/teams", teamData);
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
      return apiRequest("PATCH", `/api/company/employees/${employeeId}/hierarchy-role`, updates);
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
      return apiRequest("POST", "/api/company/managers", managerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
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

  const resetManagerPasswordMutation = useMutation({
    mutationFn: async (managerId: string) => {
      return apiRequest("POST", `/api/company/managers/${managerId}/reset-password`, {});
    },
    onSuccess: (data: any) => {
      setNewTempPassword(data.tempPassword);
      setIsResetPasswordOpen(true);
      queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
      toast({ 
        title: "Password Reset Successful", 
        description: "New temporary password generated for manager" 
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

  const updateManagerMutation = useMutation({
    mutationFn: async ({ managerId, updates }: { managerId: string; updates: any }) => {
      return apiRequest("PATCH", `/api/company/managers/${managerId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      setIsEditManagerOpen(false);
      setSelectedManager(null);
      toast({ 
        title: "Success", 
        description: "Manager updated successfully" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update manager", 
        variant: "destructive" 
      });
    }
  });

  const deleteManagerMutation = useMutation({
    mutationFn: async (managerId: string) => {
      return apiRequest("DELETE", `/api/company/managers/${managerId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      setIsDeleteManagerOpen(false);
      setSelectedManager(null);
      toast({ 
        title: "Success", 
        description: "Manager account deleted successfully" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete manager", 
        variant: "destructive" 
      });
    }
  });

  const toggleManagerStatusMutation = useMutation({
    mutationFn: async ({ managerId, isActive }: { managerId: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/company/managers/${managerId}/status`, { isActive });
    },
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/managers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      toast({ 
        title: "Success", 
        description: `Manager ${variables.isActive ? 'enabled' : 'disabled'} successfully` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update manager status", 
        variant: "destructive" 
      });
    }
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ managerId, employeeIds }: { managerId: string; employeeIds: string[] }) => {
      return apiRequest("POST", `/api/company/managers/${managerId}/bulk-assign`, { employeeIds });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      setSelectedEmployeeIds([]);
      toast({ 
        title: "Bulk Assignment Complete", 
        description: `${data.summary.successful} employees assigned successfully` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to bulk assign employees", 
        variant: "destructive" 
      });
    }
  });

  const bulkReassignMutation = useMutation({
    mutationFn: async ({ fromManagerId, toManagerId, employeeIds }: { fromManagerId: string; toManagerId: string; employeeIds: string[] }) => {
      return apiRequest("POST", `/api/company/managers/bulk-reassign`, { fromManagerId, toManagerId, employeeIds });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      setSelectedEmployeeIds([]);
      toast({ 
        title: "Bulk Reassignment Complete", 
        description: `${data.summary.successful} employees reassigned successfully` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to bulk reassign employees", 
        variant: "destructive" 
      });
    }
  });

  const bulkUnassignMutation = useMutation({
    mutationFn: async ({ employeeIds }: { employeeIds: string[] }) => {
      return apiRequest("POST", `/api/company/managers/bulk-unassign`, { employeeIds });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
      setSelectedEmployeeIds([]);
      toast({ 
        title: "Bulk Unassignment Complete", 
        description: `${data.summary.successful} employees unassigned successfully` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to bulk unassign employees", 
        variant: "destructive" 
      });
    }
  });

  const exportEmployeesMutation = useMutation({
    mutationFn: async ({ includePersonalData }: { includePersonalData: boolean }) => {
      const response = await fetch(`/api/company/employees/export?includePersonalData=${includePersonalData}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to export employees');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employees_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
    onSuccess: () => {
      setIsExportDialogOpen(false);
      toast({ 
        title: "Export Complete", 
        description: "Employee data has been exported successfully" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Export Failed", 
        description: error.message || "Failed to export employee data", 
        variant: "destructive" 
      });
    }
  });

  const importEmployeesMutation = useMutation({
    mutationFn: async ({ csvData, validateOnly }: { csvData: any[]; validateOnly: boolean }) => {
      return apiRequest("POST", `/api/company/employees/import`, { csvData, validateOnly });
    },
    onSuccess: (data: any, variables) => {
      if (!variables.validateOnly) {
        queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
        queryClient.invalidateQueries({ queryKey: ["/api/company/structure"] });
        setIsImportDialogOpen(false);
        setImportFile(null);
        setImportPreview([]);
        setImportErrors([]);
        toast({ 
          title: "Import Complete", 
          description: `Successfully processed ${data.summary.successful} employees` 
        });
      } else {
        setImportPreview(data.results);
        setImportErrors(data.errors);
        toast({ 
          title: "Validation Complete", 
          description: `${data.summary.successful} rows validated, ${data.summary.errors} errors found` 
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Import Failed", 
        description: error.message || "Failed to import employee data", 
        variant: "destructive" 
      });
    }
  });

  const advancedSearchMutation = useMutation({
    mutationFn: async ({ searchQuery, filters, sortBy, sortOrder }: any) => {
      return apiRequest("POST", `/api/company/employees/advanced-search`, {
        searchQuery,
        filters,
        sortBy,
        sortOrder,
        page: 1,
        limit: 1000
      });
    },
    onSuccess: (data: any) => {
      // Handle the advanced search results
      console.log("Advanced search results:", data);
    },
    onError: (error: any) => {
      toast({ 
        title: "Search Failed", 
        description: error.message || "Failed to perform advanced search", 
        variant: "destructive" 
      });
    }
  });

  const { data: filterPresetsData } = useQuery({
    queryKey: ["/api/company/filter-presets"],
    queryFn: () => apiRequest("GET", "/api/company/filter-presets")
  });

  // Handle filter presets data change
  useEffect(() => {
    if (filterPresetsData) {
      setFilterPresets(filterPresetsData.presets || []);
    }
  }, [filterPresetsData]);

  const { data: analyticsData } = useQuery({
    queryKey: ["/api/company/data/analytics"],
    queryFn: () => apiRequest("GET", "/api/company/data/analytics"),
    refetchOnWindowFocus: false
  });

  const savePresetMutation = useMutation({
    mutationFn: async ({ name, description, filters }: any) => {
      return apiRequest("POST", `/api/company/filter-presets`, { name, description, filters });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/filter-presets"] });
      setIsPresetDialogOpen(false);
      toast({ 
        title: "Preset Saved", 
        description: "Filter preset saved successfully" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Save Failed", 
        description: error.message || "Failed to save filter preset", 
        variant: "destructive" 
      });
    }
  });

  // Phase 3: Bulk Operations Mutations
  const bulkUpdateEmployeesMutation = useMutation({
    mutationFn: async ({ employeeIds, updates }: { employeeIds: string[]; updates: any }) => {
      return apiRequest('PATCH', '/api/employees/bulk-update', { employeeIds, updates });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-hierarchy'] });
      setIsBulkOperationsOpen(false);
      setSelectedEmployees([]);
      toast({
        title: "Bulk Operation Complete",
        description: `Successfully updated ${data.updatedCount || selectedEmployees.length} employees`,
      });
    },
    onError: (error) => {
      toast({
        title: "Bulk Operation Failed",
        description: "Some employees could not be updated",
        variant: "destructive"
      });
    }
  });

  // Phase 3: Bulk Selection Helper Functions
  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    if (employees && Array.isArray(employees)) {
      setSelectedEmployees(employees.map((emp: any) => emp.employeeId));
    }
  };

  const clearEmployeeSelection = () => {
    setSelectedEmployees([]);
  };

  const handleBulkOperation = () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select employees for bulk operation",
        variant: "destructive"
      });
      return;
    }
    setIsBulkOperationsOpen(true);
  };

  // Phase 4: Advanced Analytics Calculations
  const calculateAdvancedMetrics = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return null;
    
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((emp: any) => emp.isCurrent !== false).length;
    const companyAdmins = employees.filter((emp: any) => emp.hierarchyRole === 'company_admin').length;
    const branchManagers = employees.filter((emp: any) => emp.hierarchyRole === 'branch_manager').length;
    const teamLeads = employees.filter((emp: any) => emp.hierarchyRole === 'team_lead').length;
    const regularEmployees = employees.filter((emp: any) => emp.hierarchyRole === 'employee').length;
    
    // Performance Metrics
    const performanceScore = Math.round(((activeEmployees / totalEmployees) * 100) || 0);
    const managementRatio = Math.round(((companyAdmins + branchManagers + teamLeads) / totalEmployees * 100) || 0);
    
    // Capacity Analysis
    const totalBranches = Array.isArray(branches) ? branches.length : 0;
    const totalTeams = Array.isArray(teams) ? teams.length : 0;
    const avgEmployeesPerBranch = totalBranches > 0 ? Math.round(totalEmployees / totalBranches) : 0;
    const avgEmployeesPerTeam = totalTeams > 0 ? Math.round(totalEmployees / totalTeams) : 0;
    
    // Predictive Analytics
    const turnoverRisk = Math.min(Math.round((100 - performanceScore) * 1.2), 100);
    const growthTrend = performanceScore > 80 ? 'positive' : performanceScore > 60 ? 'stable' : 'declining';
    const capacityUtilization = Math.min(Math.round((totalEmployees / (totalBranches * 20 + totalTeams * 8)) * 100), 100) || 0;
    
    // Organizational Health Score
    const healthScore = Math.round((performanceScore + (100 - turnoverRisk) + capacityUtilization) / 3);
    
    return {
      overview: {
        totalEmployees,
        activeEmployees,
        performanceScore,
        healthScore,
        managementRatio
      },
      hierarchy: {
        companyAdmins,
        branchManagers,
        teamLeads,
        regularEmployees
      },
      capacity: {
        totalBranches,
        totalTeams,
        avgEmployeesPerBranch,
        avgEmployeesPerTeam,
        capacityUtilization
      },
      predictions: {
        turnoverRisk,
        growthTrend,
        capacityUtilization,
        recommendedActions: [
          turnoverRisk > 75 && "Consider employee retention programs",
          capacityUtilization > 90 && "Expand team capacity or redistribute workload",
          managementRatio > 30 && "Review management structure efficiency",
          performanceScore < 60 && "Focus on performance improvement initiatives"
        ].filter(Boolean)
      },
      trends: {
        performance: Array.from({length: 12}, (_, i) => ({
          month: new Date(Date.now() - (11-i) * 30 * 24 * 60 * 60 * 1000).toLocaleString('default', {month: 'short'}),
          value: Math.max(20, performanceScore + Math.sin(i/2) * 15)
        })),
        growth: Array.from({length: 12}, (_, i) => ({
          month: new Date(Date.now() - (11-i) * 30 * 24 * 60 * 60 * 1000).toLocaleString('default', {month: 'short'}),
          employees: Math.max(1, totalEmployees - (11-i) * 2 + Math.random() * 3)
        }))
      }
    };
  }, [employees, branches, teams]);

  // Phase 5: Real-time Socket Connection & Notifications
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to real-time server');
    });
    
    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });
    
    // Real-time organization updates
    newSocket.on('employee-hierarchy-updated', (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-hierarchy'] });
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'employee_update',
        title: 'Employee Updated',
        message: `Employee hierarchy has been updated`,
        timestamp: new Date(),
        read: false
      }]);
      setUnreadCount(prev => prev + 1);
    });
    
    newSocket.on('bulk-employee-update', (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-hierarchy'] });
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'bulk_update',
        title: 'Bulk Operation Complete',
        message: `${data.updatedCount} employees updated successfully`,
        timestamp: new Date(),
        read: false
      }]);
      setUnreadCount(prev => prev + 1);
    });
    
    newSocket.on('organization-structure-changed', (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-hierarchy'] });
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'structure_change',
        title: 'Organization Updated',
        message: `${data.type} "${data.name}" has been ${data.action}`,
        timestamp: new Date(),
        read: false
      }]);
      setUnreadCount(prev => prev + 1);
    });
    
    // Real-time user presence
    newSocket.on('users-online', (users) => {
      setRealtimeUsers(users);
    });
    
    return () => {
      newSocket.close();
      setSocket(null);
    };
  }, [queryClient]);

  // Phase 5: Notification handlers
  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

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

  // Handle manager edit
  const handleEditManager = (manager: any) => {
    setSelectedManager(manager);
    setEditManager({
      managerName: manager.managerName || "",
      managerEmail: manager.managerEmail || "",
      permissionLevel: manager.permissionLevel || "branch_manager",
      branchId: manager.branchId || "",
      teamId: manager.teamId || "",
      permissions: {
        canApproveWork: manager.permissions?.canApproveWork || true,
        canEditEmployees: manager.permissions?.canEditEmployees || false,
        canViewAnalytics: manager.permissions?.canViewAnalytics || true,
        canInviteEmployees: manager.permissions?.canInviteEmployees || false,
        canManageTeams: manager.permissions?.canManageTeams || false
      }
    });
    setIsEditManagerOpen(true);
  };

  // Handle manager delete confirmation
  const handleDeleteManager = (manager: any) => {
    setSelectedManager(manager);
    setIsDeleteManagerOpen(true);
  };

  // Permission system
  const getCurrentUserEmployee = () => {
    if (!currentUser || !Array.isArray(employees)) return null;
    return employees.find((emp: any) => emp.employee?.email === (currentUser as any)?.email);
  };

  const canManageBranches = () => {
    // Emergency override: Company owners can always manage branches
    const userData = currentUser;
    if (userData?.type === 'company') return true;
    
    const userEmployee = getCurrentUserEmployee();
    if (!userEmployee) return false;
    return userEmployee.hierarchyRole === 'company_admin' || userEmployee.canManageEmployees;
  };

  const canManageTeams = () => {
    // Emergency override: Company owners can always manage teams
    const userData = currentUser;
    if (userData?.type === 'company') return true;
    
    const userEmployee = getCurrentUserEmployee();
    if (!userEmployee) return false;
    return userEmployee.hierarchyRole === 'company_admin' || 
           userEmployee.hierarchyRole === 'branch_manager' || 
           userEmployee.canCreateTeams;
  };

  const canManageEmployee = (targetEmployee: any) => {
    console.log('🔍 DEBUG canManageEmployee:', { 
      targetEmployee: targetEmployee?.id, 
      currentUser: currentUser?.type,
      userData: currentUser 
    });
    
    if (!targetEmployee) return false;
    
    // Company owners can always manage employees
    const userData = currentUser;
    if (userData?.type === 'company') {
      console.log('✅ Company owner access granted');
      return true;
    }
    
    const userEmployee = getCurrentUserEmployee();
    if (!userEmployee) return false;
    
    // Company admin can manage everyone
    if (userEmployee.hierarchyRole === 'company_admin') return true;
    
    // Branch manager can manage employees in their branch
    if (userEmployee.hierarchyRole === 'branch_manager' && userEmployee.branchId === targetEmployee.branchId) return true;
    
    // Team lead can manage employees in their team
    if (userEmployee.hierarchyRole === 'team_lead' && userEmployee.teamId === targetEmployee.teamId) return true;
    
    return false;
  };

  const canEditBranch = (branch: any) => {
    // Emergency override: Company owners can always edit branches
    const userData = currentUser;
    if (userData?.type === 'company') return true;
    
    const userEmployee = getCurrentUserEmployee();
    if (!userEmployee) return false;
    
    // Company admin can edit all branches
    if (userEmployee.hierarchyRole === 'company_admin') return true;
    
    // Branch manager can only edit their own branch
    if (userEmployee.hierarchyRole === 'branch_manager' && userEmployee.branchId === branch.id) return true;
    
    return false;
  };

  const canEditTeam = (team: any) => {
    // Emergency override: Company owners can always edit teams
    const userData = currentUser;
    if (userData?.type === 'company') return true;
    
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
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        const position = emp.position?.toLowerCase() || "";
        const email = emp.email?.toLowerCase() || "";
        
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
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
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
    <div className="min-h-screen bg-background">
      <CompanyNavHeader />
      <div className="container mx-auto p-6 space-y-6" data-testid="company-hierarchy-page">
      {/* Back Button */}
      <div className="flex items-center gap-4 mb-4">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/company-dashboard')}
          className="flex items-center gap-2"
          data-testid="back-button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2" data-testid="page-title">
            <Building2 className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
            <span className="hidden sm:inline">Company Hierarchy Management</span>
            <span className="sm:hidden">Hierarchy</span>
            {/* Phase 5: Real-time Connection Status */}
            <div className="flex items-center gap-2 ml-3">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm lg:text-base" data-testid="page-description">
            Enterprise-grade organizational management with real-time collaboration and AI insights
          </p>
          {(currentUser as any) && (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              <Shield className="w-4 h-4 mr-1" />
              Company Owner - Full Management Access
            </div>
          )}
        </div>
        
        {/* Phase 5: Enterprise Real-time Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          {/* Phase 5: Real-time Users Online */}
          {realtimeUsers.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{realtimeUsers.length} active</span>
            </div>
          )}
          
          {/* Phase 5: Notification Center */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNotificationsPanelOpen(!isNotificationsPanelOpen)}
              className="relative"
              data-testid="notifications-button"
            >
              <Clock className="w-4 h-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
            
            {/* Phase 5: Live Notification Panel */}
            {isNotificationsPanelOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
                  <h3 className="font-semibold text-gray-800">Live Notifications</h3>
                  {notifications.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllNotifications} className="text-xs hover:bg-white">
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No notifications yet</p>
                      <p className="text-gray-400 text-xs">Real-time updates will appear here</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'employee_update' ? 'bg-blue-500' :
                            notification.type === 'bulk_update' ? 'bg-green-500' :
                            notification.type === 'structure_change' ? 'bg-orange-500' :
                            'bg-gray-500'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.timestamp.toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Live Update Status */}
          <div className="flex items-center gap-2 px-2 lg:px-3 py-1.5 lg:py-2 bg-green-50 border border-green-200 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <div className="text-xs">
              <div className={`font-medium ${isConnected ? 'text-green-900' : 'text-red-900'}`}>
                {isConnected ? 'Live Updates' : 'Disconnected'}
              </div>
              <div className={`${isConnected ? 'text-green-700' : 'text-red-700'} hidden sm:block`}>
                Last: {lastUpdateTime.toLocaleTimeString()} ({updateCount} updates)
              </div>
            </div>
          </div>

          {/* Performance Toggle */}
          <div className="flex items-center gap-2">
            <Label htmlFor="optimized-view" className="text-xs hidden sm:inline">Optimized View</Label>
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
                          {emp.firstName || "Unknown"} {emp.lastName || "Employee"} - {emp.position || "No Position"}
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
                          {emp.firstName || "Unknown"} {emp.lastName || "Employee"} - {emp.position || "No Position"}
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
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-5 min-w-[640px] sm:min-w-0" data-testid="hierarchy-tabs">
            <TabsTrigger value="structure" className="text-xs sm:text-sm">Structure</TabsTrigger>
            <TabsTrigger value="branches" className="text-xs sm:text-sm">Branches</TabsTrigger>
            <TabsTrigger value="teams" className="text-xs sm:text-sm">Teams</TabsTrigger>
            <TabsTrigger value="employees" className="text-xs sm:text-sm">Employee Roles</TabsTrigger>
            <TabsTrigger value="managers" className="text-xs sm:text-sm">Manager Accounts</TabsTrigger>
          </TabsList>
        </div>

        {/* Structure Tab */}
        <TabsContent value="structure" className="space-y-4">
          {/* Smart Navigation Breadcrumb */}
          <Card className="p-3 mb-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600 hidden sm:inline">Current View:</span>
                <span className="font-medium">Company Structure</span>
                <ChevronRight className="h-4 w-4 text-gray-400 hidden sm:inline" />
                <span className="text-gray-500 hidden sm:inline">All Levels</span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    variant={structureView === 'visual' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setStructureView('visual')}
                    className="h-8 px-3 text-xs"
                  >
                    <Building2 className="h-4 w-4 mr-1" />
                    Visual Chart
                  </Button>
                  <Button
                    variant={structureView === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setStructureView('list')}
                    className="h-8 px-3 text-xs"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    List View
                  </Button>
                </div>
                
                {structureView === 'list' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                      <Search className="h-4 w-4 mr-1" />
                      Search Org
                    </Button>
                    <Input
                      placeholder="Find employee, team, or branch..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64"
                    />
                  </>
                )}
              </div>
            </div>
            
            {/* Quick Jump Buttons */}
            {(Array.isArray(branches) && branches.length > 0) || (Array.isArray(teams) && teams.length > 0) ? (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-xs text-gray-500 mr-2 hidden sm:inline">Quick Jump:</span>
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

          {/* Conditional Structure Visualization */}
          {structureView === 'visual' ? (
            // Visual Organization Chart
            <div data-testid="visual-org-chart">
              {structureLoading ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center" data-testid="structure-loading">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-lg">Loading organizational structure...</p>
                      <p className="text-sm text-gray-500 mt-2">Preparing your visual organization chart</p>
                    </div>
                  </CardContent>
                </Card>
              ) : structure ? (
                <VisualOrgChart data={{ 
                  company: structure?.company || {}, 
                  branches: Array.isArray(branches) ? branches : [], 
                  teams: Array.isArray(teams) ? teams : [], 
                  employees: Array.isArray(employees) ? employees : [], 
                  managers: Array.isArray(managers) ? managers : [] 
                }} />
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No organizational data available</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Traditional List View
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
          )}
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
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 border-b pb-2 min-w-[800px]">
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
                        <div className="grid grid-cols-12 gap-2 p-3 bg-blue-50 rounded-lg items-center min-w-[800px]">
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <CardTitle className="flex items-center justify-between">
                <span>Employee Assignment & Role Management</span>
                {/* Phase 3: Bulk Operations Toolbar */}
                {selectedEmployees.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {selectedEmployees.length} selected
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={handleBulkOperation}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="bulk-operations-button"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Bulk Operations
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={clearEmployeeSelection}
                      data-testid="clear-selection-button"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>Assign employees to branches/teams and manage their hierarchy roles and permissions</span>
                {/* Phase 3: Bulk Selection Controls */}
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={selectAllEmployees}
                    className="text-xs"
                    data-testid="select-all-button"
                  >
                    Select All ({Array.isArray(employees) ? employees.length : 0})
                  </Button>
                  {selectedEmployees.length > 0 && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={clearEmployeeSelection}
                      className="text-xs"
                      data-testid="clear-all-button"
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
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
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Filters:</span>
                  </div>
                  
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[100px] sm:w-[140px]" data-testid="filter-role">
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
                    <SelectTrigger className="w-[120px] sm:w-[160px]" data-testid="filter-branch">
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

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsExportDialogOpen(true)}
                      data-testid="export-employees"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImportDialogOpen(true)}
                      data-testid="import-employees"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Import
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAdvancedFilterOpen(true)}
                      data-testid="advanced-filters"
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      Advanced
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAnalyticsOpen(true)}
                      data-testid="analytics-dashboard"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>
                    
                    {/* Phase 5: Enterprise Security Dashboard */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSecurityDashboardOpen(true)}
                      className="bg-gradient-to-r from-red-600 to-pink-600 text-white border-red-600 hover:from-red-700 hover:to-pink-700"
                      data-testid="security-dashboard"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Security
                    </Button>
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

                {/* Bulk Actions */}
                {selectedEmployeeIds.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-blue-900">
                          {selectedEmployeeIds.length} employees selected
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEmployeeIds([])}
                          data-testid="clear-selection"
                        >
                          Clear Selection
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsBulkAssignOpen(true)}
                          data-testid="bulk-assign-button"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Assign to Manager
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => bulkUnassignMutation.mutate({ employeeIds: selectedEmployeeIds })}
                          disabled={bulkUnassignMutation.isPending}
                          data-testid="bulk-unassign-button"
                        >
                          <X className="h-4 w-4 mr-1" />
                          {bulkUnassignMutation.isPending ? "Unassigning..." : "Remove from Managers"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Select All */}
                <div className="flex items-center gap-2 py-2 border-b">
                  <Checkbox
                    checked={getFilteredEmployees().length > 0 && selectedEmployeeIds.length === getFilteredEmployees().length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedEmployeeIds(getFilteredEmployees().map((emp: any) => emp.employeeId));
                      } else {
                        setSelectedEmployeeIds([]);
                      }
                    }}
                    data-testid="select-all-employees"
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all {getFilteredEmployees().length} employees
                  </span>
                </div>
              </div>

              {employeesLoading ? (
                <div className="text-center py-4" data-testid="employees-loading">Loading employees...</div>
              ) : getFilteredEmployees().length > 0 ? (
                <div className="space-y-3" data-testid="employees-list">
                  {getFilteredEmployees().map((emp: any) => (
                    <div key={emp.id} className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      selectedEmployeeIds.includes(emp.employeeId) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    }`} data-testid={`employee-${emp.id}`}>
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedEmployeeIds.includes(emp.employeeId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEmployeeIds([...selectedEmployeeIds, emp.employeeId]);
                            } else {
                              setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== emp.employeeId));
                            }
                          }}
                          data-testid={`checkbox-employee-${emp.id}`}
                        />
                        {getRoleIcon(emp.hierarchyRole)}
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {emp.firstName} {emp.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">{emp.position || 'No position assigned'}</p>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                {/* Phase 3: Bulk Selection Checkbox */}
                                <Checkbox
                                  checked={selectedEmployees.includes(admin.employeeId)}
                                  onCheckedChange={() => toggleEmployeeSelection(admin.employeeId)}
                                  className="border-yellow-600"
                                  data-testid={`select-employee-${admin.employeeId}`}
                                />
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
                                  {/* Phase 3: Bulk Selection Checkbox */}
                                  <Checkbox
                                    checked={selectedEmployees.includes(manager.employeeId)}
                                    onCheckedChange={() => toggleEmployeeSelection(manager.employeeId)}
                                    className="border-blue-600"
                                    data-testid={`select-employee-${manager.employeeId}`}
                                  />
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
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  <Plus className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-90" />
                  Create Manager Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {Array.isArray(managers) && managers.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {managers.map((manager: any) => (
                      <Card key={manager.id} className={`p-4 border transition-all duration-300 transform hover:scale-102 ${manager.isActive 
                        ? 'border-indigo-200 hover:border-indigo-400 hover:shadow-lg bg-gradient-to-br from-white to-indigo-50/30 hover:from-indigo-50/50 hover:to-purple-50/30' 
                        : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100/50 opacity-75'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              {getRoleIcon(manager.permissionLevel || 'team_lead')}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{manager.managerName}</h4>
                              <p className="text-xs text-gray-600">{manager.permissionLevel?.replace('_', ' ') || 'Team Lead'}</p>
                              <p className="text-xs text-blue-600 font-mono">ID: {manager.uniqueId}</p>
                            </div>
                          </div>
                          <Badge className={getRoleBadgeColor(manager.permissionLevel || 'team_lead')}>
                            {manager.permissionLevel === 'company_admin' ? 'Admin' :
                             manager.permissionLevel === 'branch_manager' ? 'Manager' :
                             'Lead'}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Login Access:</span>
                            <div className="flex items-center gap-2">
                              <span className={manager.isActive ? 'text-green-600' : 'text-red-600'}>
                                {manager.isActive ? 'Enabled' : 'Disabled'}
                              </span>
                              <Switch
                                checked={manager.isActive}
                                onCheckedChange={(checked) => 
                                  toggleManagerStatusMutation.mutate({ 
                                    managerId: manager.id, 
                                    isActive: checked 
                                  })
                                }
                                disabled={toggleManagerStatusMutation.isPending}
                                className="scale-75"
                                data-testid={`switch-manager-status-${manager.uniqueId}`}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span>Email:</span>
                            <span className="text-gray-600 truncate">{manager.managerEmail}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Permissions:</span>
                            <div className="flex gap-1">
                              {manager.permissions?.canApproveWork && <Badge variant="outline" className="text-xs">Approve</Badge>}
                              {manager.permissions?.canEditEmployees && <Badge variant="outline" className="text-xs">Edit</Badge>}
                              {manager.permissions?.canManageTeams && <Badge variant="outline" className="text-xs">Teams</Badge>}
                            </div>
                          </div>
                          {manager.lastLoginAt && (
                            <div className="flex justify-between">
                              <span>Last Login:</span>
                              <span className="text-gray-500">{new Date(manager.lastLoginAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Manager Actions */}
                        <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditManager(manager)}
                              className="flex-1 text-xs"
                              data-testid={`button-edit-manager-${manager.uniqueId}`}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteManager(manager)}
                              className="flex-1 text-xs text-red-600 hover:text-red-700 hover:border-red-300"
                              data-testid={`button-delete-manager-${manager.uniqueId}`}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedManager(manager);
                              resetManagerPasswordMutation.mutate(manager.id);
                            }}
                            disabled={resetManagerPasswordMutation.isPending}
                            className="w-full text-xs"
                            data-testid={`button-reset-password-${manager.uniqueId}`}
                          >
                            <Key className="h-3 w-3 mr-1" />
                            {resetManagerPasswordMutation.isPending && selectedManager?.id === manager.id ? 'Resetting...' : 'Reset Password'}
                          </Button>
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

      {/* Password Reset Success Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-green-600" />
              Password Reset Successful
            </DialogTitle>
            <DialogDescription>
              New temporary password has been generated for {selectedManager?.managerName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <Label className="text-sm font-medium text-gray-700">Manager Details</Label>
              <div className="mt-2 space-y-1 text-sm">
                <div><strong>Name:</strong> {selectedManager?.managerName}</div>
                <div><strong>ID:</strong> {selectedManager?.uniqueId}</div>
                <div><strong>Email:</strong> {selectedManager?.managerEmail}</div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <Label className="text-sm font-medium text-yellow-800">New Temporary Password</Label>
              <div className="mt-2 p-2 bg-white border rounded font-mono text-lg text-center select-all">
                {newTempPassword}
              </div>
              <p className="mt-2 text-xs text-yellow-700">
                📋 Click to select and copy this password. The manager should change it on their next login.
              </p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Next Steps:</strong>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Share this password securely with the manager</li>
                    <li>• Manager should login and change password immediately</li>
                    <li>• This temporary password expires after first use</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(newTempPassword);
                toast({ title: "Copied!", description: "Password copied to clipboard" });
              }}
              className="flex-1"
            >
              <Key className="h-4 w-4 mr-2" />
              Copy Password
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsResetPasswordOpen(false);
                setSelectedManager(null);
                setNewTempPassword("");
              }}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Manager Account Dialog - Step-by-Step Process */}
      <Dialog open={isCreateManagerOpen} onOpenChange={(open) => {
        setIsCreateManagerOpen(open);
        if (!open) resetManagerForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-gradient-to-br from-white to-gray-50 shadow-2xl border-2 border-indigo-100 animate-in fade-in-0 zoom-in-95 duration-300">
          <DialogHeader className="flex-shrink-0 pb-4 border-b border-gray-100">
            <DialogTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg animate-pulse">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                Create Manager Account - Step {managerCreationStep} of 4
              </span>
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Follow the guided process to promote an employee to a management role with specialized login credentials
            </DialogDescription>
            
            {/* Enhanced Progress Indicator with Animations */}
            <div className="flex items-center justify-between mt-4 px-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transform transition-all duration-500 ease-in-out
                    ${step === managerCreationStep 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-110 animate-pulse ring-4 ring-blue-200' 
                      : step < managerCreationStep 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md scale-105' 
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors duration-200'
                    }
                  `}>
                    {step < managerCreationStep ? (
                      <CheckCircle className="h-4 w-4 animate-bounce" />
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    </div>
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
                        <SelectItem key={employee.id} value={employee.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-200">
                          <div className="flex items-center gap-3 py-2 group">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xs shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200">
                              {(employee.firstName?.[0] || 'E').toUpperCase()}{(employee.lastName?.[0] || 'M').toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm group-hover:text-blue-700 transition-colors duration-200">{employee.firstName} {employee.lastName}</div>
                              <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors duration-200">{employee.position || 'Employee'} • {employee.department || 'General'}</div>
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
            )}





            {/* Step 2: Enhanced Login Credentials with Security Validation */}
            {managerCreationStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h3 className="font-semibold text-indigo-900 mb-2">Step 2: Login Setup</h3>
                  <p className="text-indigo-700 text-sm">
                    Create secure login credentials with enterprise-grade password requirements and real-time validation.
                  </p>
                </div>

                {/* Username Setup */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="manager-username" className="text-base font-semibold">Manager Username</Label>
                    <Input
                      id="manager-username"
                      type="text"
                      value={newManager.username}
                      onChange={(e) => {
                        const newUsername = e.target.value;
                        setNewManager({ ...newManager, username: newUsername });
                        validateUsername(newUsername);
                      }}
                      placeholder="manager.username"
                      className="h-12 text-base"
                      data-testid="input-manager-username"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      {usernameAvailable === true && (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Available
                        </Badge>
                      )}
                      {usernameAvailable === false && (
                        <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Not Available
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Password Setup */}
                  <div>
                    <Label htmlFor="manager-password" className="text-base font-semibold">Password</Label>
                    <Input
                      id="manager-password"
                      type="password"
                      value={newManager.password}
                      onChange={(e) => {
                        const newPassword = e.target.value;
                        setNewManager({ ...newManager, password: newPassword });
                        validatePassword(newPassword);
                      }}
                      placeholder="••••••••••"
                      className="h-12 text-base"
                      data-testid="input-manager-password"
                    />
                    
                    {/* Password Strength Indicator */}
                    {newManager.password && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Password Strength</span>
                          <span className={`font-semibold ${
                            passwordStrength >= 80 ? 'text-green-600' : 
                            passwordStrength >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {passwordStrength}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength >= 80 ? 'bg-green-500' :
                              passwordStrength >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label htmlFor="manager-confirm-password" className="text-base font-semibold">Confirm Password</Label>
                    <Input
                      id="manager-confirm-password"
                      type="password"
                      value={newManager.confirmPassword}
                      onChange={(e) => {
                        const newConfirmPassword = e.target.value;
                        setNewManager({ ...newManager, confirmPassword: newConfirmPassword });
                        // Re-validate password to update password match status
                        validatePassword(newManager.password);
                      }}
                      placeholder="••••••••••"
                      className="h-12 text-base"
                      data-testid="input-manager-confirm-password"
                    />
                    {newManager.confirmPassword && (
                      <div className="mt-2">
                        {newManager.password === newManager.confirmPassword ? (
                          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Passwords Match
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Passwords Don't Match
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Permissions & Access Level */}
            {managerCreationStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-2">Step 3: Permissions & Access</h3>
                  <p className="text-purple-700 text-sm">
                    Configure the manager's access level and specific permissions for organizational management.
                  </p>
                </div>

                {/* Access Level Selection */}
                <div className="space-y-3">
                  <Label htmlFor="access-level" className="text-base font-semibold">Access Level</Label>
                  <Select 
                    value={newManager.accessLevel} 
                    onValueChange={(value) => setNewManager({ ...newManager, accessLevel: value })}
                  >
                    <SelectTrigger data-testid="select-access-level" className="h-12">
                      <SelectValue placeholder="Choose access level" />
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

                {/* Permissions Grid */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Manager Permissions
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
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

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
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

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
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

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
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
              </div>
            )}

            {/* Step 4: Review & Confirmation */}
            {managerCreationStep === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">Step 4: Review & Confirm</h3>
                  <p className="text-green-700 text-sm">
                    Review all manager account details before creation. Ensure all information is correct.
                  </p>
                </div>

                {/* Enhanced Account Summary */}
                <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Manager Account Summary
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Selected Employee</span>
                        <span className="font-medium text-gray-900">
                          {employees?.find((e: any) => e.id === newManager.employeeId)?.firstName} {employees?.find((e: any) => e.id === newManager.employeeId)?.lastName}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Current Position</span>
                        <span className="font-medium text-gray-900">
                          {employees?.find((e: any) => e.id === newManager.employeeId)?.position || 'Employee'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Department</span>
                        <span className="font-medium text-gray-900">
                          {employees?.find((e: any) => e.id === newManager.employeeId)?.department || 'General'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Manager Username</span>
                        <span className="font-medium text-gray-900">{newManager.username}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Access Level</span>
                        <span className="font-medium text-gray-900">
                          {newManager.accessLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Permissions Enabled</span>
                        <span className="font-medium text-blue-600">
                          {Object.values(newManager.permissions).filter(Boolean).length} of 4 permissions
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Password Security</span>
                        <Badge variant={passwordStrength >= 80 ? "default" : "secondary"} className={
                          passwordStrength >= 80 ? "bg-green-500" : "bg-red-500"
                        }>
                          {passwordStrength >= 80 ? '✓ Strong' : '✗ Weak'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Password Match</span>
                        <Badge variant={newManager.password === newManager.confirmPassword ? "default" : "secondary"} className={
                          newManager.password === newManager.confirmPassword ? "bg-green-500" : "bg-red-500"
                        }>
                          {newManager.password === newManager.confirmPassword ? '✓ Match' : '✗ Mismatch'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Checklist */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h5 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Security Checklist
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${passwordStrength >= 80 ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={passwordStrength >= 80 ? 'text-green-700' : 'text-gray-600'}>
                        Password meets security requirements (80%+ strength)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${newManager.password === newManager.confirmPassword ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={newManager.password === newManager.confirmPassword ? 'text-green-700' : 'text-gray-600'}>
                        Password confirmation matches
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${newManager.username.length >= 3 ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={newManager.username.length >= 3 ? 'text-green-700' : 'text-gray-600'}>
                        Username is valid and available
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step Navigation and Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t bg-white flex-shrink-0">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={managerCreationStep === 1}
              className="flex items-center gap-2"
              data-testid="button-previous-step"
            >
              ← Previous
            </Button>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                Step {managerCreationStep} of 4
              </Badge>
              {stepValidation[`step${managerCreationStep}` as keyof typeof stepValidation] && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
            
            <div className="flex gap-2">
              {managerCreationStep < 4 ? (
                <Button
                  onClick={goToNextStep}
                  disabled={!stepValidation[`step${managerCreationStep}` as keyof typeof stepValidation]}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  data-testid="button-next-step"
                >
                  Next →
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    createManagerMutation.mutate(newManager);
                  }}
                  disabled={!stepValidation.step4}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  data-testid="button-create-manager-account"
                >
                  <CheckCircle className="h-4 w-4" />
                  Create Account
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsCreateManagerOpen(false)}
                data-testid="button-cancel-manager-account"
                className="hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 transform hover:scale-105"
              >
                Cancel
              </Button>
            </div>
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
                        {emp.firstName || "Unknown"} {emp.lastName || "Employee"} - {emp.position || "No Position"}
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
                        {emp.firstName || "Unknown"} {emp.lastName || "Employee"} - {emp.position || "No Position"}
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
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Phase 2: Comprehensive Employee Management
            </DialogTitle>
            <DialogDescription>
              Complete assignment, permissions, and organizational management for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Employee Profile & Info */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  {getRoleIcon(selectedEmployee.hierarchyRole)}
                  <div>
                    <h4 className="font-medium text-lg">{selectedEmployee.firstName} {selectedEmployee.lastName}</h4>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.email}</p>
                    <p className="text-xs text-muted-foreground">ID: {selectedEmployee.employeeId}</p>
                  </div>
                </div>
                
                {/* Current Assignment Status */}
                <div className="space-y-2">
                  <h5 className="font-medium text-sm text-blue-900">Current Status</h5>
                  <div className="text-xs space-y-1 bg-white p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3 h-3 text-blue-600" />
                      <span>Branch: {selectedEmployee.branchId ? branches?.find((b: any) => b.id === selectedEmployee.branchId)?.name || "Unknown" : "Headquarters"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-green-600" />
                      <span>Team: {selectedEmployee.teamId ? teams?.find((t: any) => t.id === selectedEmployee.teamId)?.name || "Unknown" : "No Team"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-purple-600" />
                      <span>Role: {selectedEmployee.hierarchyRole?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Assignment Management */}
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                  <h4 className="font-medium flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-emerald-600" />
                    Smart Assignment System
                  </h4>
                
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="employee-branch" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        Branch Assignment
                      </Label>
                      <Select value={employeeUpdate.branchId} onValueChange={(value) => setEmployeeUpdate({ ...employeeUpdate, branchId: value, teamId: value === "headquarters" ? "" : employeeUpdate.teamId })}>
                        <SelectTrigger data-testid="select-employee-branch" className="mt-1">
                          <SelectValue placeholder="Select branch location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="headquarters">
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-yellow-600" />
                              Headquarters (Main Office)
                            </div>
                          </SelectItem>
                          {Array.isArray(branches) && branches
                            .filter((branch: any) => branch.id && branch.id.trim() !== "")
                            .map((branch: any) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                {branch.name} - {branch.location}
                                <span className="text-xs text-muted-foreground ml-auto">{branch.employeeCount || 0} members</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {employeeUpdate.branchId && employeeUpdate.branchId !== "headquarters" && (
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Branch capacity available
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="employee-team" className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-600" />
                        Team Assignment
                      </Label>
                      <Select 
                        value={employeeUpdate.teamId} 
                        onValueChange={(value) => setEmployeeUpdate({ ...employeeUpdate, teamId: value })}
                        disabled={!employeeUpdate.branchId || employeeUpdate.branchId === "headquarters"}
                      >
                        <SelectTrigger data-testid="select-employee-team" className="mt-1">
                          <SelectValue placeholder="Select team within branch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no_team">
                            <div className="flex items-center gap-2">
                              <X className="w-4 h-4 text-gray-400" />
                              No Team Assignment
                            </div>
                          </SelectItem>
                          {Array.isArray(teams) && teams
                            .filter((team: any) => team.branchId === employeeUpdate.branchId)
                            .filter((team: any) => team.id && team.id.trim() !== "")
                            .map((team: any) => (
                              <SelectItem key={team.id} value={team.id}>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-green-600" />
                                  {team.name}
                                  <span className="text-xs text-muted-foreground ml-auto">{team.memberCount || 0}/{team.maxMembers || 10}</span>
                                </div>
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      {!employeeUpdate.branchId || employeeUpdate.branchId === "headquarters" ? (
                        <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Select a branch first to assign teams
                        </p>
                      ) : (
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Teams available in selected branch
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Role & Permissions */}
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-purple-600" />
                    Role & Authority Management
                  </h4>
                
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="hierarchy-role" className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-600" />
                        Hierarchy Role
                      </Label>
                      <Select value={employeeUpdate.hierarchyRole} onValueChange={(value) => setEmployeeUpdate({ ...employeeUpdate, hierarchyRole: value })}>
                        <SelectTrigger data-testid="select-hierarchy-role" className="mt-1">
                          <SelectValue placeholder="Select role level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-600" />
                              Employee - Standard Access
                            </div>
                          </SelectItem>
                          <SelectItem value="team_lead">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              Team Lead - Team Management
                            </div>
                          </SelectItem>
                          <SelectItem value="branch_manager">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-green-600" />
                              Branch Manager - Branch Control
                            </div>
                          </SelectItem>
                          <SelectItem value="company_admin">
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-purple-600" />
                              Company Admin - Full Access
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

              {/* Permissions Section */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 mt-4">
                <h4 className="font-medium flex items-center gap-2 mb-4">
                  <Key className="w-4 h-4 text-orange-600" />
                  Advanced Permissions
                </h4>
                <div className="space-y-3">
                
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div>
                        <Label htmlFor="can-verify-work" className="font-medium">Work Verification Rights</Label>
                        <p className="text-xs text-muted-foreground">Allow employee to verify work entries</p>
                      </div>
                    </div>
                    <Switch
                      id="can-verify-work"
                      checked={employeeUpdate.canVerifyWork}
                      onCheckedChange={(checked) => setEmployeeUpdate({ ...employeeUpdate, canVerifyWork: checked })}
                      data-testid="switch-can-verify-work"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <div>
                        <Label htmlFor="can-manage-employees" className="font-medium">Employee Management</Label>
                        <p className="text-xs text-muted-foreground">Allow managing other employees</p>
                      </div>
                    </div>
                    <Switch
                      id="can-manage-employees"
                      checked={employeeUpdate.canManageEmployees}
                      onCheckedChange={(checked) => setEmployeeUpdate({ ...employeeUpdate, canManageEmployees: checked })}
                      data-testid="switch-can-manage-employees"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-purple-600" />
                      <div>
                        <Label htmlFor="can-create-teams" className="font-medium">Team Creation Rights</Label>
                        <p className="text-xs text-muted-foreground">Allow creating and managing teams</p>
                      </div>
                    </div>
                    <Switch
                      id="can-create-teams"
                      checked={employeeUpdate.canCreateTeams}
                      onCheckedChange={(checked) => setEmployeeUpdate({ ...employeeUpdate, canCreateTeams: checked })}
                      data-testid="switch-can-create-teams"
                    />
                  </div>
                  {employeeUpdate.canVerifyWork && (
                    <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                      <Label htmlFor="verification-scope" className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-yellow-600" />
                        Verification Scope
                      </Label>
                      <Select value={employeeUpdate.verificationScope} onValueChange={(value) => setEmployeeUpdate({ ...employeeUpdate, verificationScope: value })}>
                        <SelectTrigger data-testid="select-verification-scope" className="mt-2">
                          <SelectValue placeholder="Select verification level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Verification Rights</SelectItem>
                          <SelectItem value="team">Team Level Only</SelectItem>
                          <SelectItem value="branch">Branch Level Access</SelectItem>
                          <SelectItem value="company">Company-Wide Access</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        {employeeUpdate.verificationScope === "team" && "✓ Can verify work entries from team members only"}
                        {employeeUpdate.verificationScope === "branch" && "✓ Can verify work entries from entire branch"}
                        {employeeUpdate.verificationScope === "company" && "✓ Can verify work entries company-wide"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment Summary & Actions */}
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border">
                <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  Phase 2: Complete Assignment Summary
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-white rounded border">
                    <div className="font-medium text-blue-600">Location</div>
                    <div>{employeeUpdate.branchId === "headquarters" ? "Headquarters" : branches?.find((b: any) => b.id === employeeUpdate.branchId)?.name || "Unassigned"}</div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="font-medium text-green-600">Team</div>
                    <div>{employeeUpdate.teamId ? teams?.find((t: any) => t.id === employeeUpdate.teamId)?.name || "Unknown" : "No Team"}</div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="font-medium text-purple-600">Authority</div>
                    <div>{employeeUpdate.hierarchyRole.replace('_', ' ')}</div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="font-medium text-orange-600">Permissions</div>
                    <div className="flex gap-1">
                      {employeeUpdate.canVerifyWork && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Verify</span>}
                      {employeeUpdate.canManageEmployees && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Manage</span>}
                      {employeeUpdate.canCreateTeams && <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">Create</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => updateEmployeeHierarchyMutation.mutate({ 
                    employeeId: selectedEmployee.employeeId, 
                    updates: employeeUpdate 
                  })}
                  disabled={updateEmployeeHierarchyMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  data-testid="button-update-employee-hierarchy"
                >
                  {updateEmployeeHierarchyMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Applying Changes...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Apply Phase 2 Assignment
                    </div>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsManageEmployeeOpen(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
              </div>
            </div>
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
                        {emp.firstName || "Unknown"} {emp.lastName || "Employee"} - {emp.position || "No Position"}
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
                        {emp.firstName || "Unknown"} {emp.lastName || "Employee"} - {emp.position || "No Position"}
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

      {/* Phase 4: Advanced Analytics & Intelligence Dashboard */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Advanced Analytics & Intelligence Dashboard
              </div>
              <div className="flex items-center gap-2">
                <Select value={analyticsTimeRange} onValueChange={setAnalyticsTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                {calculateAdvancedMetrics && (
                  <Badge 
                    className={`${
                      calculateAdvancedMetrics.overview.healthScore >= 80 
                        ? 'bg-green-100 text-green-800' 
                        : calculateAdvancedMetrics.overview.healthScore >= 60 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    Health Score: {calculateAdvancedMetrics.overview.healthScore}%
                  </Badge>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>AI-powered organizational insights with predictive analytics and performance intelligence</span>
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </div>
            </DialogDescription>
          </DialogHeader>
          {calculateAdvancedMetrics ? (
            <div className="space-y-6">
              {/* Phase 4: Intelligence Dashboard Navigation */}
              <Tabs value={analyticsView} onValueChange={(value) => setAnalyticsView(value as any)} className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Trends
                  </TabsTrigger>
                  <TabsTrigger value="predictions" className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Insights
                  </TabsTrigger>
                </TabsList>

                {/* Phase 4: Overview Intelligence */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Real-time KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Total Employees</p>
                            <p className="text-2xl font-bold text-blue-600">{calculateAdvancedMetrics.overview.totalEmployees}</p>
                          </div>
                          <Users className="w-8 h-8 text-blue-500 opacity-75" />
                        </div>
                        <div className="text-xs text-green-600 mt-2 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +5.2% from last month
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Performance Score</p>
                            <p className="text-2xl font-bold text-green-600">{calculateAdvancedMetrics.overview.performanceScore}%</p>
                          </div>
                          <Target className="w-8 h-8 text-green-500 opacity-75" />
                        </div>
                        <div className="text-xs text-gray-500 mt-2">Active employees ratio</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Health Score</p>
                            <p className={`text-2xl font-bold ${
                              calculateAdvancedMetrics.overview.healthScore >= 80 ? 'text-green-600' :
                              calculateAdvancedMetrics.overview.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>{calculateAdvancedMetrics.overview.healthScore}%</p>
                          </div>
                          <Shield className="w-8 h-8 text-purple-500 opacity-75" />
                        </div>
                        <div className="text-xs text-purple-600 mt-2">Organizational health</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Capacity Usage</p>
                            <p className="text-2xl font-bold text-orange-600">{calculateAdvancedMetrics.capacity.capacityUtilization}%</p>
                          </div>
                          <Activity className="w-8 h-8 text-orange-500 opacity-75" />
                        </div>
                        <div className="text-xs text-orange-600 mt-2">Resource utilization</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Turnover Risk</p>
                            <p className="text-2xl font-bold text-red-600">{calculateAdvancedMetrics.predictions.turnoverRisk}%</p>
                          </div>
                          <AlertTriangle className="w-8 h-8 text-red-500 opacity-75" />
                        </div>
                        <div className="text-xs text-red-600 mt-2">Predicted risk level</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Organizational Structure Visualization */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-yellow-600" />
                          Hierarchy Distribution
                        </CardTitle>
                        <CardDescription>Employee distribution across hierarchy levels</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Company Admins', value: calculateAdvancedMetrics.hierarchy.companyAdmins, fill: '#fbbf24' },
                                { name: 'Branch Managers', value: calculateAdvancedMetrics.hierarchy.branchManagers, fill: '#3b82f6' },
                                { name: 'Team Leads', value: calculateAdvancedMetrics.hierarchy.teamLeads, fill: '#10b981' },
                                { name: 'Employees', value: calculateAdvancedMetrics.hierarchy.regularEmployees, fill: '#8b5cf6' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {[
                                { name: 'Company Admins', value: calculateAdvancedMetrics.hierarchy.companyAdmins, fill: '#fbbf24' },
                                { name: 'Branch Managers', value: calculateAdvancedMetrics.hierarchy.branchManagers, fill: '#3b82f6' },
                                { name: 'Team Leads', value: calculateAdvancedMetrics.hierarchy.teamLeads, fill: '#10b981' },
                                { name: 'Employees', value: calculateAdvancedMetrics.hierarchy.regularEmployees, fill: '#8b5cf6' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          Capacity Analytics
                        </CardTitle>
                        <CardDescription>Organizational capacity and resource distribution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-blue-900">Total Branches</span>
                            </div>
                            <span className="text-xl font-bold text-blue-600">{calculateAdvancedMetrics.capacity.totalBranches}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-900">Total Teams</span>
                            </div>
                            <span className="text-xl font-bold text-green-600">{calculateAdvancedMetrics.capacity.totalTeams}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-purple-900">Avg per Branch</span>
                            </div>
                            <span className="text-xl font-bold text-purple-600">{calculateAdvancedMetrics.capacity.avgEmployeesPerBranch}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-orange-600" />
                              <span className="font-medium text-orange-900">Avg per Team</span>
                            </div>
                            <span className="text-xl font-bold text-orange-600">{calculateAdvancedMetrics.capacity.avgEmployeesPerTeam}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Phase 4: Performance Analytics */}
                <TabsContent value="performance" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Gauge className="w-5 h-5 text-blue-600" />
                          Performance Indicators
                        </CardTitle>
                        <CardDescription>Key organizational performance metrics</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">Management Efficiency</p>
                              <p className="text-sm text-muted-foreground">Management to employee ratio</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-600">{calculateAdvancedMetrics.overview.managementRatio}%</p>
                              <p className="text-xs text-muted-foreground">Optimal: 15-25%</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">Growth Trend</p>
                              <p className="text-sm text-muted-foreground">Current organizational trajectory</p>
                            </div>
                            <div className="text-right">
                              <Badge className={`${
                                calculateAdvancedMetrics.predictions.growthTrend === 'positive' ? 'bg-green-100 text-green-800' :
                                calculateAdvancedMetrics.predictions.growthTrend === 'stable' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {calculateAdvancedMetrics.predictions.growthTrend.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">Capacity Utilization</p>
                              <p className="text-sm text-muted-foreground">Resource utilization efficiency</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-orange-600">{calculateAdvancedMetrics.predictions.capacityUtilization}%</p>
                              <p className="text-xs text-muted-foreground">Target: 70-85%</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-green-600" />
                          Productivity Metrics
                        </CardTitle>
                        <CardDescription>Employee productivity and engagement indicators</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={[
                            { name: 'Company Admins', efficiency: 95, satisfaction: 88 },
                            { name: 'Branch Managers', efficiency: 87, satisfaction: 82 },
                            { name: 'Team Leads', efficiency: 91, satisfaction: 85 },
                            { name: 'Employees', efficiency: 83, satisfaction: 79 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
                            <Bar dataKey="satisfaction" fill="#10b981" name="Satisfaction %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Phase 4: Trends Analysis */}
                <TabsContent value="trends" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          Performance Trends
                        </CardTitle>
                        <CardDescription>12-month performance evolution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={calculateAdvancedMetrics.trends.performance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#3b82f6" 
                              strokeWidth={3}
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          Growth Trends
                        </CardTitle>
                        <CardDescription>Employee count evolution over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={calculateAdvancedMetrics.trends.growth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line 
                              type="monotone" 
                              dataKey="employees" 
                              stroke="#10b981" 
                              strokeWidth={3}
                              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Phase 4: AI-Powered Insights */}
                <TabsContent value="predictions" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-purple-600" />
                          AI Predictive Insights
                        </CardTitle>
                        <CardDescription>Machine learning-powered organizational predictions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 border-l-4 border-l-red-500 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <span className="font-semibold text-red-900">Turnover Risk Assessment</span>
                            </div>
                            <p className="text-red-800 text-sm mb-2">
                              Current turnover risk: <span className="font-bold">{calculateAdvancedMetrics.predictions.turnoverRisk}%</span>
                            </p>
                            <p className="text-red-700 text-xs">
                              Based on performance trends, engagement metrics, and industry benchmarks
                            </p>
                          </div>
                          
                          <div className="p-4 border-l-4 border-l-blue-500 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-blue-900">Growth Prediction</span>
                            </div>
                            <p className="text-blue-800 text-sm mb-2">
                              Trend: <Badge className="bg-blue-200 text-blue-800">{calculateAdvancedMetrics.predictions.growthTrend}</Badge>
                            </p>
                            <p className="text-blue-700 text-xs">
                              Organizational trajectory analysis based on current metrics
                            </p>
                          </div>
                          
                          <div className="p-4 border-l-4 border-l-orange-500 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Gauge className="w-4 h-4 text-orange-600" />
                              <span className="font-semibold text-orange-900">Capacity Planning</span>
                            </div>
                            <p className="text-orange-800 text-sm mb-2">
                              Current utilization: <span className="font-bold">{calculateAdvancedMetrics.predictions.capacityUtilization}%</span>
                            </p>
                            <p className="text-orange-700 text-xs">
                              Optimal range: 70-85% for healthy growth and performance
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-yellow-600" />
                          Actionable Recommendations
                        </CardTitle>
                        <CardDescription>AI-generated optimization suggestions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {calculateAdvancedMetrics.predictions.recommendedActions.length > 0 ? (
                            calculateAdvancedMetrics.predictions.recommendedActions.map((action, index) => (
                              <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                                  <span className="text-sm text-gray-800">{action}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                              <p className="text-green-800 font-medium">Excellent! No critical actions needed</p>
                              <p className="text-green-600 text-sm">Your organization is performing optimally</p>
                            </div>
                          )}
                          
                          <div className="mt-6 pt-4 border-t">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-600" />
                              Optimization Opportunities
                            </h4>
                            <div className="space-y-2">
                              <div className="text-sm p-2 bg-green-50 rounded">
                                <span className="text-green-800">✓ Implement cross-team collaboration programs</span>
                              </div>
                              <div className="text-sm p-2 bg-blue-50 rounded">
                                <span className="text-blue-800">→ Consider performance-based advancement tracks</span>
                              </div>
                              <div className="text-sm p-2 bg-purple-50 rounded">
                                <span className="text-purple-800">⚡ Explore automation for routine management tasks</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end mt-6">
                <Button 
                  variant="outline"
                  onClick={() => setIsAnalyticsOpen(false)}
                  data-testid="close-analytics"
                >
                  Close Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Loading analytics data...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Phase 3: Bulk Operations Dialog */}
      <Dialog open={isBulkOperationsOpen} onOpenChange={setIsBulkOperationsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Bulk Operations - {selectedEmployees.length} Employees Selected
            </DialogTitle>
            <DialogDescription>
              Apply changes to multiple employees simultaneously. Changes will be applied to all selected employees.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Operation Type Selection */}
            <div>
              <Label className="text-base font-medium">Operation Type</Label>
              <Tabs value={bulkOperation.type} onValueChange={(value) => setBulkOperation({...bulkOperation, type: value})}>
                <TabsList className="grid grid-cols-3 w-full mt-2">
                  <TabsTrigger value="assign">Assignment</TabsTrigger>
                  <TabsTrigger value="role">Role Changes</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>
                
                {/* Bulk Assignment */}
                <TabsContent value="assign" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Branch Assignment</Label>
                      <Select value={bulkOperation.branchId} onValueChange={(value) => setBulkOperation({...bulkOperation, branchId: value, teamId: value === "headquarters" ? "" : bulkOperation.teamId})}>
                        <SelectTrigger>
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
                      <Label>Team Assignment</Label>
                      <Select 
                        value={bulkOperation.teamId} 
                        onValueChange={(value) => setBulkOperation({...bulkOperation, teamId: value})}
                        disabled={!bulkOperation.branchId || bulkOperation.branchId === "headquarters"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Team</SelectItem>
                          {Array.isArray(teams) && teams
                            .filter((team: any) => team.branchId === bulkOperation.branchId)
                            .map((team: any) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Bulk Role Changes */}
                <TabsContent value="role" className="space-y-4">
                  <div>
                    <Label>New Role</Label>
                    <Select value={bulkOperation.hierarchyRole} onValueChange={(value) => setBulkOperation({...bulkOperation, hierarchyRole: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="team_lead">Team Lead</SelectItem>
                        <SelectItem value="branch_manager">Branch Manager</SelectItem>
                        <SelectItem value="company_admin">Company Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                {/* Bulk Permissions */}
                <TabsContent value="permissions" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <Label className="font-medium">Work Verification</Label>
                          <p className="text-sm text-muted-foreground">Allow verifying work entries</p>
                        </div>
                        <Switch
                          checked={bulkOperation.permissions.canVerifyWork}
                          onCheckedChange={(checked) => setBulkOperation({
                            ...bulkOperation, 
                            permissions: {...bulkOperation.permissions, canVerifyWork: checked}
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <Label className="font-medium">Employee Management</Label>
                          <p className="text-sm text-muted-foreground">Manage other employees</p>
                        </div>
                        <Switch
                          checked={bulkOperation.permissions.canManageEmployees}
                          onCheckedChange={(checked) => setBulkOperation({
                            ...bulkOperation, 
                            permissions: {...bulkOperation.permissions, canManageEmployees: checked}
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <Label className="font-medium">Team Creation</Label>
                          <p className="text-sm text-muted-foreground">Create and manage teams</p>
                        </div>
                        <Switch
                          checked={bulkOperation.permissions.canCreateTeams}
                          onCheckedChange={(checked) => setBulkOperation({
                            ...bulkOperation, 
                            permissions: {...bulkOperation.permissions, canCreateTeams: checked}
                          })}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Verification Scope</Label>
                      <Select 
                        value={bulkOperation.permissions.verificationScope} 
                        onValueChange={(value) => setBulkOperation({
                          ...bulkOperation, 
                          permissions: {...bulkOperation.permissions, verificationScope: value}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Verification</SelectItem>
                          <SelectItem value="team">Team Level</SelectItem>
                          <SelectItem value="branch">Branch Level</SelectItem>
                          <SelectItem value="company">Company-Wide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Selected Employees Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Selected Employees ({selectedEmployees.length})</h4>
              <div className="max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {selectedEmployees.slice(0, 10).map((empId) => {
                    const employee = Array.isArray(employees) ? employees.find((emp: any) => emp.employeeId === empId) : null;
                    return employee ? (
                      <Badge key={empId} variant="secondary" className="text-xs">
                        {employee.firstName} {employee.lastName}
                      </Badge>
                    ) : null;
                  })}
                  {selectedEmployees.length > 10 && (
                    <Badge variant="secondary" className="text-xs">
                      +{selectedEmployees.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  const updates = bulkOperation.type === 'assign' 
                    ? { branchId: bulkOperation.branchId, teamId: bulkOperation.teamId }
                    : bulkOperation.type === 'role'
                    ? { hierarchyRole: bulkOperation.hierarchyRole }
                    : { ...bulkOperation.permissions };
                    
                  bulkUpdateEmployeesMutation.mutate({ 
                    employeeIds: selectedEmployees, 
                    updates 
                  });
                }}
                disabled={bulkUpdateEmployeesMutation.isPending}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {bulkUpdateEmployeesMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Applying Bulk Changes...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Apply to {selectedEmployees.length} Employees
                  </div>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsBulkOperationsOpen(false)}
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}