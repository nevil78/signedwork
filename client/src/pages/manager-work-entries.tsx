import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function ManagerWorkEntries() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const { toast } = useToast();
  const { manager, isLoading, isAuthenticated, permissions } = useManagerAuth();
  
  const [filters, setFilters] = useState({
    status: "all",
    approvalStatus: "all"
  });
  
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [approvalData, setApprovalData] = useState({
    approvalStatus: "",
    managerFeedback: "",
    managerRating: 0
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
    queryKey: ["/api/manager/work-entries", filters],
    enabled: isAuthenticated && permissions.canApproveWork,
  });

  // Approve/reject work entry mutation
  const approvalMutation = useMutation({
    mutationFn: async (data: { workEntryId: string; approvalStatus: string; managerFeedback?: string; managerRating?: number }) => {
      return await apiRequest("POST", `/api/manager/work-entries/${data.workEntryId}/approve`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/work-entries"] });
      setSelectedEntry(null);
      setApprovalData({ approvalStatus: "", managerFeedback: "", managerRating: 0 });
      toast({
        title: "Success",
        description: "Work entry processed successfully.",
      });
    }
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

  const pendingEntries = workEntries?.filter((entry: any) => entry.approvalStatus === 'pending') || [];
  const approvedEntries = workEntries?.filter((entry: any) => entry.approvalStatus === 'manager_approved') || [];
  const rejectedEntries = workEntries?.filter((entry: any) => entry.approvalStatus === 'manager_rejected') || [];

  const handleApproval = () => {
    if (!selectedEntry || !approvalData.approvalStatus) return;
    
    approvalMutation.mutate({
      workEntryId: selectedEntry.id,
      approvalStatus: approvalData.approvalStatus,
      managerFeedback: approvalData.managerFeedback || undefined,
      managerRating: approvalData.managerRating || undefined
    });
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

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Approval Status</label>
                <Select value={filters.approvalStatus} onValueChange={(value) => setFilters(prev => ({ ...prev, approvalStatus: value }))}>
                  <SelectTrigger data-testid="select-approval-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Approvals</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="manager_approved">Approved</SelectItem>
                    <SelectItem value="manager_rejected">Needs Changes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Entries List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Work Entries</h2>
            <div className="space-y-4">
              {workEntries?.map((entry: any) => (
                <Card 
                  key={entry.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedEntry?.id === entry.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedEntry(entry)}
                  data-testid={`work-entry-${entry.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{entry.title}</h3>
                      <Badge 
                        variant={
                          entry.approvalStatus === 'pending' ? 'secondary' :
                          entry.approvalStatus === 'manager_approved' ? 'default' : 'destructive'
                        }
                      >
                        {entry.approvalStatus === 'pending' && 'Pending'}
                        {entry.approvalStatus === 'manager_approved' && 'Approved'}
                        {entry.approvalStatus === 'manager_rejected' && 'Needs Changes'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {entry.employeeName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                      {entry.managerRating && (
                        <div className="flex items-center gap-2">
                          {getRatingStars(entry.managerRating)}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                      {entry.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
              
              {workEntries?.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No work entries found for your team.</p>
                  </CardContent>
                </Card>
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
                    By {selectedEntry.employeeName} • {new Date(selectedEntry.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-700">{selectedEntry.description}</p>
                  </div>

                  {selectedEntry.achievements && selectedEntry.achievements.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Achievements</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {selectedEntry.achievements.map((achievement: string, index: number) => (
                          <li key={index}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedEntry.approvalStatus === 'pending' && (
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium">Manager Approval</h4>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Decision</label>
                        <Select 
                          value={approvalData.approvalStatus} 
                          onValueChange={(value) => setApprovalData(prev => ({ ...prev, approvalStatus: value }))}
                        >
                          <SelectTrigger data-testid="select-approval-decision">
                            <SelectValue placeholder="Select decision" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manager_approved">Approve</SelectItem>
                            <SelectItem value="manager_rejected">Request Changes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {approvalData.approvalStatus === 'manager_approved' && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Rating (Optional)</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setApprovalData(prev => ({ ...prev, managerRating: star }))}
                                className="p-1"
                                data-testid={`star-rating-${star}`}
                              >
                                <Star 
                                  className={`h-6 w-6 ${
                                    star <= approvalData.managerRating 
                                      ? 'text-yellow-500 fill-current' 
                                      : 'text-gray-300'
                                  }`} 
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {approvalData.approvalStatus === 'manager_rejected' ? 'Feedback (Required)' : 'Feedback (Optional)'}
                        </label>
                        <Textarea
                          value={approvalData.managerFeedback}
                          onChange={(e) => setApprovalData(prev => ({ ...prev, managerFeedback: e.target.value }))}
                          placeholder={
                            approvalData.approvalStatus === 'manager_rejected' 
                              ? "Please explain what changes are needed..."
                              : "Add any feedback or comments..."
                          }
                          rows={4}
                          data-testid="textarea-feedback"
                        />
                      </div>

                      <Button 
                        onClick={handleApproval}
                        disabled={
                          !approvalData.approvalStatus || 
                          (approvalData.approvalStatus === 'manager_rejected' && !approvalData.managerFeedback.trim()) ||
                          approvalMutation.isPending
                        }
                        className="w-full"
                        data-testid="button-submit-approval"
                      >
                        {approvalMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </div>
                        ) : (
                          approvalData.approvalStatus === 'manager_approved' ? 'Approve Entry' : 'Request Changes'
                        )}
                      </Button>
                    </div>
                  )}

                  {selectedEntry.approvalStatus !== 'pending' && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Manager Decision</h4>
                      <div className="space-y-2">
                        <Badge 
                          variant={selectedEntry.approvalStatus === 'manager_approved' ? 'default' : 'destructive'}
                        >
                          {selectedEntry.approvalStatus === 'manager_approved' ? 'Approved' : 'Changes Requested'}
                        </Badge>
                        
                        {selectedEntry.managerFeedback && (
                          <div>
                            <p className="text-sm font-medium">Feedback:</p>
                            <p className="text-sm text-gray-700">{selectedEntry.managerFeedback}</p>
                          </div>
                        )}
                        
                        {selectedEntry.managerRating && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Rating:</span>
                            {getRatingStars(selectedEntry.managerRating)}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500">
                          Processed on {new Date(selectedEntry.managerApprovalDate).toLocaleDateString()}
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
    </div>
  );
}