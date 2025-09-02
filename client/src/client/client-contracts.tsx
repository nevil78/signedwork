import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter,
  DollarSign,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Download
} from "lucide-react";

interface Contract {
  id: string;
  contractId: string;
  projectId: string;
  employeeId: string;
  title: string;
  description: string;
  status: string;
  contractType: string;
  totalAmount: number;
  hourlyRate: number;
  startDate: string;
  endDate: string;
  created_at: string;
  updated_at: string;
}

export default function ClientContracts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch client's contracts
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["/api/freelance/contracts"],
  });

  // Filter contracts
  const filteredContracts = contracts.filter((contract: Contract) => {
    const matchesSearch = contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contract.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contract.contractId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    const matchesTab = activeTab === "all" || contract.status === activeTab;
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Calculate stats
  const activeContracts = contracts.filter((c: Contract) => c.status === 'active').length;
  const completedContracts = contracts.filter((c: Contract) => c.status === 'completed').length;
  const totalSpent = contracts.reduce((sum: number, c: Contract) => sum + (c.totalAmount || 0), 0);
  const pendingContracts = contracts.filter((c: Contract) => c.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              My Contracts
            </h1>
            <p className="text-gray-600 mt-1">
              Track and manage your active freelance contracts
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-contracts">{activeContracts}</div>
              <p className="text-xs text-gray-600">Currently ongoing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-completed-contracts">{completedContracts}</div>
              <p className="text-xs text-gray-600">Successfully finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-pending-contracts">{pendingContracts}</div>
              <p className="text-xs text-gray-600">Awaiting start</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-spent">
                ${totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">All contracts</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search contracts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" data-testid="tab-all">All ({contracts.length})</TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">Active ({activeContracts})</TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">Completed ({completedContracts})</TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">Pending ({pendingContracts})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredContracts.length > 0 ? (
              filteredContracts.map((contract: Contract) => (
                <Card key={contract.id} className="hover:shadow-md transition-shadow" data-testid={`contract-card-${contract.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-1" data-testid={`contract-title-${contract.id}`}>
                              {contract.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2" data-testid={`contract-id-${contract.id}`}>
                              Contract ID: {contract.contractId}
                            </p>
                            <p className="text-gray-600 line-clamp-2" data-testid={`contract-description-${contract.id}`}>
                              {contract.description}
                            </p>
                          </div>
                          <Badge 
                            className={getStatusColor(contract.status)} 
                            data-testid={`contract-status-${contract.id}`}
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(contract.status)}
                              {contract.status}
                            </span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1" data-testid={`contract-amount-${contract.id}`}>
                            <DollarSign className="w-4 h-4" />
                            <span>
                              {contract.contractType === 'hourly' 
                                ? `$${contract.hourlyRate}/hr` 
                                : `$${contract.totalAmount?.toLocaleString() || '0'}`
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1" data-testid={`contract-type-${contract.id}`}>
                            <FileText className="w-4 h-4" />
                            <span>{contract.contractType}</span>
                          </div>
                          
                          <div className="flex items-center gap-1" data-testid={`contract-start-${contract.id}`}>
                            <Calendar className="w-4 h-4" />
                            <span>Start: {new Date(contract.startDate).toLocaleDateString()}</span>
                          </div>
                          
                          {contract.endDate && (
                            <div className="flex items-center gap-1" data-testid={`contract-end-${contract.id}`}>
                              <Calendar className="w-4 h-4" />
                              <span>End: {new Date(contract.endDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm" data-testid={`button-view-${contract.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        
                        <Button variant="outline" size="sm" data-testid={`button-download-${contract.id}`}>
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar for active contracts */}
                    {contract.status === 'active' && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>75% Complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full w-3/4"></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12" data-testid="empty-contracts">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchQuery || statusFilter !== "all" 
                      ? "No contracts match your filters" 
                      : "No contracts yet"
                    }
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your filters to see more contracts"
                      : "Contracts will appear here when you hire freelancers for your projects"
                    }
                  </p>
                  {(!searchQuery && statusFilter === "all") && (
                    <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-browse-projects">
                      Browse Your Projects
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}