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

        {/* Work Entries List - Grouped by Employee */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Work Entries by Employee</h2>
            <div className="space-y-6">
              {Object.keys(groupedEntries).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No work entries found for your team.</p>
                  </CardContent>
                </Card>
              ) : (
                Object.values(groupedEntries).map((employeeGroup: any) => (
                  <div key={employeeGroup.employee.id} className="border rounded-lg bg-white">
                    {/* Employee Header */}
                    <div className="p-4 border-b bg-gray-50 rounded-t-lg">
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
                        <Badge variant="outline" className="text-xs">
                          {employeeGroup.entries.length} {employeeGroup.entries.length === 1 ? 'entry' : 'entries'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Employee's Work Entries */}
                    <div className="p-4 space-y-3">
                      {employeeGroup.entries.map((entry: any, index: number) => (
                        <Card 
                          key={entry.id} 
                          className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                            entry.approvalStatus === 'pending_review' ? 'border-l-orange-500' :
                            entry.approvalStatus === 'approved' ? 'border-l-green-500' : 'border-l-red-500'
                          } ${selectedEntry?.id === entry.id ? 'ring-2 ring-blue-500' : ''}`}
                          onClick={() => setSelectedEntry(entry)}
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
                  </div>
                ))
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