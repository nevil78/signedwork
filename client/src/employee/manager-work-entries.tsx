import { useState, useEffect, memo, useMemo, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useManagerAuth } from "@/hooks/useManagerAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  Filter,
  FileText,
  User,
  Calendar,
  Star,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ManagerWorkEntries = memo(function ManagerWorkEntries() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const { toast } = useToast();
  const { manager, isLoading, isAuthenticated, permissions } = useManagerAuth();
  
  const [filters, setFilters] = useState({
    status: "all",
    approvalStatus: "all"
  });
  

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to access work entries.",
        variant: "destructive",
      });
      setLocation("/manager/login");
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  // Check for specific entry in URL params
  useEffect(() => {
    const entryParam = new URLSearchParams(searchParams).get('entry');
    if (entryParam) {
      // Auto-open specific entry for review
      // This will be handled when workEntries data is loaded
    }
  }, [searchParams]);

  // Fetch work entries for manager's team
  const { data: workEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/manager/work-entries"],
    enabled: isAuthenticated && permissions.canApproveWork,
  });

  // Use the same approval pattern as company work entries
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [approvalFeedback, setApprovalFeedback] = useState('');
  const [feedback, setFeedback] = useState('');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});

  // Approve work entry mutation - same pattern as company
  const approveMutation = useMutation({
    mutationFn: async ({ entryId, rating, feedback }: { entryId: string; rating?: number; feedback?: string }) => {
      return await apiRequest("POST", `/api/manager/work-entries/${entryId}/approve`, { 
        rating: rating || undefined, 
        feedback: feedback || undefined 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/work-entries"] });
      toast({
        title: "Success",
        description: "Work entry approved successfully - now verified by company",
      });
      setShowApprovalDialog(false);
      setSelectedEntry(null);
      setRating(0);
      setApprovalFeedback('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve work entry",
        variant: "destructive",
      });
    },
  });

  // Request changes mutation - same pattern as company
  const requestChangesMutation = useMutation({
    mutationFn: async ({ entryId, feedback }: { entryId: string; feedback: string }) => {
      return await apiRequest("POST", `/api/manager/work-entries/${entryId}/request-changes`, { feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/work-entries"] });
      toast({
        title: "Success",
        description: "Changes requested successfully",
      });
      setShowChangesDialog(false);
      setSelectedEntry(null);
      setFeedback('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to request changes",
        variant: "destructive",
      });
    },
  });

  if (isLoading || entriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!permissions.canApproveWork) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to approve work entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/manager/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingEntries = (workEntries as any[])?.filter((entry: any) => entry.approvalStatus === 'pending_review') || [];
  const approvedEntries = (workEntries as any[])?.filter((entry: any) => entry.approvalStatus === 'approved') || [];
  const rejectedEntries = (workEntries as any[])?.filter((entry: any) => entry.approvalStatus === 'needs_changes') || [];

  // Group work entries by employee
  const groupedEntries = (workEntries as any[])?.reduce((groups: any, entry: any) => {
    const employeeName = `${entry.employee.firstName} ${entry.employee.lastName}`;
    const employeeId = entry.employee.id;
    
    if (!groups[employeeId]) {
      groups[employeeId] = {
        employeeName,
        employee: entry.employee,
        entries: []
      };
    }
    
    groups[employeeId].entries.push(entry);
    return groups;
  }, {}) || {};

  // Filter grouped entries based on search and selected employee
  const filteredGroupedEntries = Object.entries(groupedEntries).filter(([employeeId, group]: [string, any]) => {
    // Filter by selected employee
    if (selectedEmployeeId !== 'all' && employeeId !== selectedEmployeeId) {
      return false;
    }
    
    // Filter by search term (employee name or entry titles)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const employeeNameMatch = group.employeeName.toLowerCase().includes(searchLower);
      const entryTitleMatch = group.entries.some((entry: any) => 
        entry.title.toLowerCase().includes(searchLower) ||
        entry.description?.toLowerCase().includes(searchLower)
      );
      return employeeNameMatch || entryTitleMatch;
    }
    
    return true;
  }).reduce((obj: any, [employeeId, group]) => {
    obj[employeeId] = group;
    return obj;
  }, {});

  // Get unique employees for dropdown
  const employeeOptions = Object.values(groupedEntries).map((group: any) => ({
    id: group.employee.id,
    name: group.employeeName,
    entryCount: group.entries.length
  }));

  // Toggle employee expansion
  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  // Use same handler patterns as company work entries
  const handleApprove = (entry: any) => {
    setSelectedEntry(entry);
    setRating(0);
    setApprovalFeedback('');
    setShowApprovalDialog(true);
  };

  const handleRequestChanges = (entry: any) => {
    setSelectedEntry(entry);
    setShowChangesDialog(true);
  };

  const confirmApproval = () => {
    if (selectedEntry) {
      approveMutation.mutate({ 
        entryId: selectedEntry.id, 
        rating, 
        feedback: approvalFeedback 
      });
    }
  };

  const confirmRequestChanges = () => {
    if (selectedEntry && feedback.trim()) {
      requestChangesMutation.mutate({ entryId: selectedEntry.id, feedback });
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation("/manager/dashboard")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Work Entry Approvals</h1>
                <p className="text-sm text-gray-600">Review and approve team work entries</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">{(manager as any)?.managerName}</p>
              <p className="text-sm text-gray-600">{(manager as any)?.uniqueId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{pendingEntries.length}</p>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{approvedEntries.length}</p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{rejectedEntries.length}</p>
                  <p className="text-sm text-gray-600">Needs Changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Bar */}
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search employees or work entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    data-testid="input-search"
                  />
                </div>
              </div>

              {/* Employee Filter Dropdown */}
              <div>
                <label className="text-sm font-medium mb-2 block">Employee Filter</label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger data-testid="select-employee-filter">
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees ({Object.keys(groupedEntries).length})</SelectItem>
                    {employeeOptions.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} ({employee.entryCount} {employee.entryCount === 1 ? 'entry' : 'entries'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant={selectedEmployeeId === 'all' && !searchTerm ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedEmployeeId('all');
                  setSearchTerm('');
                }}
                data-testid="button-show-all"
              >
                Show All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allEmployeeIds = Object.keys(groupedEntries);
                  const newExpanded: Record<string, boolean> = {};
                  allEmployeeIds.forEach(id => newExpanded[id] = true);
                  setExpandedEmployees(newExpanded);
                }}
                data-testid="button-expand-all"
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedEmployees({})}
                data-testid="button-collapse-all"
              >
                Collapse All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Work Entries List - Grouped by Employee */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Work Entries by Employee</h2>
            <div className="space-y-6">
              {Object.keys(filteredGroupedEntries).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {searchTerm || selectedEmployeeId !== 'all' 
                        ? 'No work entries match your search criteria.' 
                        : 'No work entries found for your team.'}
                    </p>
                    {(searchTerm || selectedEmployeeId !== 'all') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedEmployeeId('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                Object.entries(filteredGroupedEntries).map(([employeeId, employeeGroup]: [string, any]) => {
                  const isExpanded = expandedEmployees[employeeId];
                  
                  return (
                    <div key={employeeId} className="border rounded-lg bg-white shadow-sm">
                      {/* Employee Header - Clickable */}
                      <div 
                        className="p-4 border-b bg-gray-50 rounded-t-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleEmployeeExpansion(employeeId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                              {employeeGroup.employeeName.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{employeeGroup.employeeName}</h3>
                              <p className="text-sm text-gray-600">{employeeGroup.employee.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {employeeGroup.entries.length} {employeeGroup.entries.length === 1 ? 'entry' : 'entries'}
                            </Badge>
                            <svg 
                              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Employee's Work Entries - Collapsible */}
                      {isExpanded && (
                        <div className="p-4 space-y-3">
                          {employeeGroup.entries.map((entry: any, index: number) => (
                            <Card 
                              key={entry.id} 
                              className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                                entry.approvalStatus === 'pending_review' ? 'border-l-orange-500' :
                                entry.approvalStatus === 'approved' ? 'border-l-green-500' : 'border-l-red-500'
                              } ${selectedEntry?.id === entry.id ? 'ring-2 ring-blue-500' : ''}`}
                              onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                              data-testid={`work-entry-${entry.id}`}
                                >
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 font-mono">#{index + 1}</span>
                                    <h4 className="font-medium text-sm">{entry.title}</h4>
                                  </div>
                                  <Badge 
                                    variant={
                                      entry.approvalStatus === 'pending_review' ? 'secondary' :
                                      entry.approvalStatus === 'approved' ? 'default' : 'destructive'
                                    }
                                    className={`text-xs ${
                                      entry.approvalStatus === 'approved' ? 'bg-green-600 text-white' : ''
                                    }`}
                                  >
                                    {entry.approvalStatus === 'pending_review' && 'Pending'}
                                    {entry.approvalStatus === 'approved' && (
                                      <span className="flex items-center gap-1">
                                        <Shield className="w-2 h-2" />
                                        Verified
                                      </span>
                                    )}
                                    {entry.approvalStatus === 'needs_changes' && 'Changes'}
                                  </Badge>
                                </div>
                                
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                  </div>
                                  {entry.companyRating && (
                                    <div className="flex items-center gap-1">
                                      {getRatingStars(entry.companyRating)}
                                    </div>
                                  )}
                                </div>
                                
                                <p className="text-xs text-gray-700 mt-2 line-clamp-2">
                                  {entry.description}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Entry Details and Approval */}
          {selectedEntry && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Entry Details</h2>
              <Card>
                <CardHeader>
                  <CardTitle>{selectedEntry.title}</CardTitle>
                  <CardDescription>
                    By {selectedEntry.employee.firstName} {selectedEntry.employee.lastName} • {new Date(selectedEntry.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Work Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">📅 Work Period</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><span className="font-medium">Start:</span> {selectedEntry.startDate}</p>
                        {selectedEntry.endDate && <p><span className="font-medium">End:</span> {selectedEntry.endDate}</p>}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">⏱️ Time & Effort</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        {selectedEntry.estimatedHours && <p><span className="font-medium">Estimated:</span> {selectedEntry.estimatedHours}h</p>}
                        {selectedEntry.actualHours && <p><span className="font-medium">Actual:</span> {selectedEntry.actualHours}h</p>}
                        <p><span className="font-medium">Priority:</span> <Badge variant="outline" className="text-xs">{selectedEntry.priority}</Badge></p>
                      </div>
                    </div>

                    {(selectedEntry.workType || selectedEntry.category) && (
                      <div>
                        <h4 className="font-medium mb-2 text-gray-900">🏷️ Classification</h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          {selectedEntry.workType && <p><span className="font-medium">Type:</span> {selectedEntry.workType}</p>}
                          {selectedEntry.category && <p><span className="font-medium">Category:</span> {selectedEntry.category}</p>}
                        </div>
                      </div>
                    )}

                    {(selectedEntry.client || selectedEntry.project || selectedEntry.externalCompanyName) && (
                      <div>
                        <h4 className="font-medium mb-2 text-gray-900">🏢 Project Info</h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          {selectedEntry.client && <p><span className="font-medium">Client:</span> {selectedEntry.client}</p>}
                          {selectedEntry.project && <p><span className="font-medium">Project:</span> {selectedEntry.project}</p>}
                          {selectedEntry.externalCompanyName && <p><span className="font-medium">External Company:</span> {selectedEntry.externalCompanyName}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">📝 Description</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{selectedEntry.description || "No description provided"}</p>
                  </div>

                  {/* Key Learnings */}
                  {selectedEntry.learnings && (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">💡 Key Learnings</h4>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md">{selectedEntry.learnings}</p>
                    </div>
                  )}

                  {/* Challenges */}
                  {selectedEntry.challenges && (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">⚠️ Challenges Faced</h4>
                      <p className="text-sm text-gray-700 bg-orange-50 p-3 rounded-md">{selectedEntry.challenges}</p>
                    </div>
                  )}

                  {/* Achievements */}
                  {selectedEntry.achievements && selectedEntry.achievements.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">🏆 Achievements</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 bg-green-50 p-3 rounded-md">
                        {selectedEntry.achievements.map((achievement: string, index: number) => (
                          <li key={index}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">🏷️ Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Billing Information */}
                  {(selectedEntry.billable !== undefined || selectedEntry.billableRate) && (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">💰 Billing</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><span className="font-medium">Billable:</span> {selectedEntry.billable ? 'Yes' : 'No'}</p>
                        {selectedEntry.billableRate && <p><span className="font-medium">Rate:</span> ${selectedEntry.billableRate}/hour</p>}
                      </div>
                    </div>
                  )}

                  {/* Status Information */}
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">📊 Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Work Status:</span>
                        <Badge variant="outline" className="ml-2 text-xs">{selectedEntry.status}</Badge>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Approval Status:</span>
                        <Badge 
                          variant={selectedEntry.approvalStatus === 'approved' ? 'default' : 'secondary'}
                          className={`ml-2 text-xs ${selectedEntry.approvalStatus === 'approved' ? 'bg-green-600 text-white' : ''}`}
                        >
                          {selectedEntry.approvalStatus === 'pending_review' && 'Pending Review'}
                          {selectedEntry.approvalStatus === 'approved' && 'Verified by Company'}
                          {selectedEntry.approvalStatus === 'needs_changes' && 'Needs Changes'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {selectedEntry.approvalStatus === 'pending_review' && (
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium">Manager Approval</h4>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleApprove(selectedEntry)} 
                          className="bg-green-600 hover:bg-green-700 flex-1"
                          data-testid="button-approve"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Entry
                        </Button>
                        <Button 
                          onClick={() => handleRequestChanges(selectedEntry)} 
                          variant="outline" 
                          className="border-red-600 text-red-600 hover:bg-red-50 flex-1"
                          data-testid="button-request-changes"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Request Changes
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedEntry.approvalStatus !== 'pending_review' && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Manager Decision</h4>
                      <div className="space-y-2">
                        <Badge 
                          variant={selectedEntry.approvalStatus === 'approved' ? 'default' : 'destructive'}
                          className={selectedEntry.approvalStatus === 'approved' ? 'bg-green-600 text-white' : 'bg-red-100 text-red-800'}
                        >
                          {selectedEntry.approvalStatus === 'approved' && <Shield className="w-3 h-3 mr-1" />}
                          {selectedEntry.approvalStatus === 'approved' ? 'Verified by Company' : 'Changes Requested'}
                        </Badge>
                        
                        {selectedEntry.feedback && (
                          <div>
                            <p className="text-sm font-medium">Feedback:</p>
                            <p className="text-sm text-gray-700">{selectedEntry.feedback}</p>
                          </div>
                        )}
                        
                        {selectedEntry.rating && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Rating:</span>
                            {getRatingStars(selectedEntry.rating)}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500">
                          Verified on {new Date(selectedEntry.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Approval Dialog - same pattern as company work entries */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="approval-dialog">
          <DialogHeader>
            <DialogTitle>Approve Work Entry</DialogTitle>
            <DialogDescription>
              Review and approve this work entry. Once approved, it will be marked as "Verified by Company" and become immutable.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="py-4 space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{selectedEntry.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  By {selectedEntry.employeeName} • {new Date(selectedEntry.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm">{selectedEntry.description}</p>
              </div>

              {/* Rating Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Rating (optional)</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-colors"
                        data-testid={`rating-star-${star}`}
                      >
                        <Star 
                          className={`h-6 w-6 ${
                            star <= rating 
                              ? 'text-yellow-500 fill-current' 
                              : 'text-gray-300 hover:text-gray-400'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                      {rating} star{rating > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Feedback Section */}
              <div className="space-y-3">
                <Label htmlFor="approval-feedback" className="text-sm font-medium">
                  Feedback for Employee (optional)
                </Label>
                <Textarea
                  id="approval-feedback"
                  placeholder="Great work! Here's some feedback to help you improve..."
                  value={approvalFeedback}
                  onChange={(e) => setApprovalFeedback(e.target.value)}
                  rows={3}
                  className="resize-none"
                  data-testid="approval-feedback-textarea"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row gap-3 pt-4 border-t bg-white dark:bg-gray-950">
            <Button 
              variant="outline" 
              onClick={() => setShowApprovalDialog(false)} 
              className="w-full sm:w-auto"
              data-testid="cancel-approval"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmApproval}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              disabled={approveMutation.isPending}
              data-testid="confirm-approval"
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve & Verify Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog - same pattern as company work entries */}
      <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="request-changes-dialog">
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Provide feedback to the employee about what needs to be changed or corrected in their work entry.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="py-4 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{selectedEntry.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  By {selectedEntry.employeeName} • {new Date(selectedEntry.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm">{selectedEntry.description}</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="changes-feedback" className="text-sm font-medium">
                  What changes are needed? *
                </Label>
                <Textarea
                  id="changes-feedback"
                  placeholder="Please explain what needs to be corrected or improved in this work entry..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="resize-none"
                  data-testid="changes-feedback-textarea"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row gap-3 pt-4 border-t bg-white dark:bg-gray-950">
            <Button 
              variant="outline" 
              onClick={() => setShowChangesDialog(false)} 
              className="w-full sm:w-auto"
              data-testid="cancel-changes"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmRequestChanges}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              disabled={!feedback.trim() || requestChangesMutation.isPending}
              data-testid="confirm-changes"
            >
              {requestChangesMutation.isPending ? 'Requesting...' : 'Request Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default ManagerWorkEntries;