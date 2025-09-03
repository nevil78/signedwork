import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  FileText,
  DollarSign,
  Clock,
  User,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit,
  Pause,
  Play,
  AlertTriangle,
  CheckCircle,
  Shield,
  MessageSquare,
  Download
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface Contract {
  id: string;
  contractId: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  type: 'hourly' | 'fixed_price';
  totalAmount: number;
  paidAmount: number;
  hourlyRate?: number;
  hoursWorked: number;
  startDate: string;
  endDate?: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    employeeId: string;
  };
  milestones: {
    id: string;
    title: string;
    amount: number;
    status: 'pending' | 'completed' | 'approved';
    dueDate: string;
  }[];
  verifiedHours: number;
  createdAt: string;
}

export default function ClientContracts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch client's contracts
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["/api/freelance/contracts"],
  });

  // Contract action mutations
  const pauseContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      return apiRequest("PATCH", `/api/freelance/contracts/${contractId}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/freelance/contracts"] });
      toast({ title: "Contract paused successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to pause contract", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resumeContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      return apiRequest("PATCH", `/api/freelance/contracts/${contractId}/resume`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/freelance/contracts"] });
      toast({ title: "Contract resumed successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to resume contract", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredContracts = contracts.filter((contract: Contract) => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${contract.employee.firstName} ${contract.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    const matchesType = typeFilter === "all" || contract.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const activeContracts = filteredContracts.filter((c: Contract) => c.status === 'active');
  const completedContracts = filteredContracts.filter((c: Contract) => c.status === 'completed');
  const pausedContracts = filteredContracts.filter((c: Contract) => c.status === 'paused');

  const totalSpent = filteredContracts.reduce((sum: number, c: Contract) => sum + (c.paidAmount || 0), 0);
  const totalValue = filteredContracts.reduce((sum: number, c: Contract) => sum + (c.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Your Contracts
            </h1>
            <p className="text-gray-600 mt-1">
              Manage contracts and track verified work from your freelancers
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Contracts
            </Button>
            <Link href="/client/projects/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                New Contract
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-contracts">{activeContracts.length}</div>
              <p className="text-xs text-gray-600">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contract Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-value">${totalValue.toLocaleString()}</div>
              <p className="text-xs text-gray-600">All contracts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-spent">${totalSpent.toLocaleString()}</div>
              <p className="text-xs text-gray-600">Payments made</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Hours</CardTitle>
              <Shield className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-verified-hours">
                {filteredContracts.reduce((sum: number, c: Contract) => sum + (c.verifiedHours || 0), 0)}
              </div>
              <p className="text-xs text-gray-600">Authenticated work</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search and Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-contracts"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="filter-type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="fixed_price">Fixed Price</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" data-testid="tab-all">
              All Contracts ({filteredContracts.length})
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">
              Active ({activeContracts.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({completedContracts.length})
            </TabsTrigger>
            <TabsTrigger value="paused" data-testid="tab-paused">
              Paused ({pausedContracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <ContractsList 
              contracts={filteredContracts} 
              isLoading={isLoading}
              onPause={(id) => pauseContractMutation.mutate(id)}
              onResume={(id) => resumeContractMutation.mutate(id)}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <ContractsList 
              contracts={activeContracts} 
              isLoading={isLoading}
              onPause={(id) => pauseContractMutation.mutate(id)}
              onResume={(id) => resumeContractMutation.mutate(id)}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <ContractsList 
              contracts={completedContracts} 
              isLoading={isLoading}
              onPause={(id) => pauseContractMutation.mutate(id)}
              onResume={(id) => resumeContractMutation.mutate(id)}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          </TabsContent>

          <TabsContent value="paused" className="space-y-4">
            <ContractsList 
              contracts={pausedContracts} 
              isLoading={isLoading}
              onPause={(id) => pauseContractMutation.mutate(id)}
              onResume={(id) => resumeContractMutation.mutate(id)}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface ContractsListProps {
  contracts: Contract[];
  isLoading: boolean;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => JSX.Element;
}

function ContractsList({ contracts, isLoading, onPause, onResume, getStatusColor, getStatusIcon }: ContractsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="flex space-x-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
          <p className="text-gray-600 mb-4">Start hiring freelancers to see contracts here</p>
          <Link href="/client/projects/new">
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Post a Job
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract: Contract) => {
        const progress = contract.totalAmount > 0 ? (contract.paidAmount / contract.totalAmount) * 100 : 0;
        
        return (
          <Card key={contract.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={contract.employee.profilePhoto} />
                      <AvatarFallback>
                        {contract.employee.firstName[0]}{contract.employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900" data-testid={`contract-title-${contract.id}`}>
                        {contract.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        with {contract.employee.firstName} {contract.employee.lastName}
                      </p>
                    </div>
                    <Badge 
                      className={`${getStatusColor(contract.status)} flex items-center gap-1`}
                      data-testid={`contract-status-${contract.id}`}
                    >
                      {getStatusIcon(contract.status)}
                      {contract.status}
                    </Badge>
                  </div>

                  <p className="text-gray-700 mb-4" data-testid={`contract-description-${contract.id}`}>
                    {contract.description}
                  </p>

                  {/* Contract Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Contract Type</p>
                      <p className="font-medium" data-testid={`contract-type-${contract.id}`}>
                        {contract.type === 'hourly' ? 'Hourly' : 'Fixed Price'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Value</p>
                      <p className="font-medium" data-testid={`contract-value-${contract.id}`}>
                        ${contract.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hours Worked</p>
                      <p className="font-medium" data-testid={`contract-hours-${contract.id}`}>
                        {contract.hoursWorked} hrs
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Verified Hours</p>
                      <p className="font-medium flex items-center gap-1" data-testid={`contract-verified-${contract.id}`}>
                        <Shield className="w-4 h-4 text-green-600" />
                        {contract.verifiedHours} hrs
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Payment Progress</span>
                      <span>${contract.paidAmount.toLocaleString()} / ${contract.totalAmount.toLocaleString()}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Contract Dates */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Started: {new Date(contract.startDate).toLocaleDateString()}</span>
                    </div>
                    {contract.endDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Ends: {new Date(contract.endDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/client/contracts/${contract.id}`}>
                    <Button variant="outline" size="sm" data-testid={`button-view-contract-${contract.id}`}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" data-testid={`button-message-${contract.id}`}>
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                  {contract.status === 'active' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onPause(contract.id)}
                      data-testid={`button-pause-contract-${contract.id}`}
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                  ) : contract.status === 'paused' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onResume(contract.id)}
                      data-testid={`button-resume-contract-${contract.id}`}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}