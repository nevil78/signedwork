import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Calendar, 
  User, 
  Building2,
  Users,
  Eye,
  AlertTriangle,
  Zap,
  Filter,
  Search
} from "lucide-react";

export default function WorkVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for work entry submission
  const [newWorkEntry, setNewWorkEntry] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 8,
    category: "development"
  });

  // State for verification actions
  const [selectedWorkEntry, setSelectedWorkEntry] = useState<any>(null);
  const [verificationNote, setVerificationNote] = useState("");
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");

  // Data queries
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: workEntries, isLoading: workEntriesLoading } = useQuery({
    queryKey: ["/api/company/work-entries"]
  });

  const { data: pendingVerifications, isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/company/work-entries/pending-verification"]
  });

  const { data: employees } = useQuery({
    queryKey: ["/api/company/employees"]
  });

  const { data: companyStructure } = useQuery({
    queryKey: ["/api/company/structure"]
  });

  // Mutations
  const submitWorkMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/company/work-entries", "POST", data),
    onSuccess: () => {
      toast({
        title: "Work Entry Submitted",
        description: "Your work entry has been submitted for verification",
      });
      setNewWorkEntry({
        title: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        hoursWorked: 8,
        category: "development"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/work-entries"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit work entry",
        variant: "destructive",
      });
    },
  });

  const verifyWorkMutation = useMutation({
    mutationFn: ({ workEntryId, action, note }: { workEntryId: string, action: 'approve' | 'reject', note: string }) => 
      apiRequest(`/api/company/work-entries/${workEntryId}/verify`, "POST", { action, note }),
    onSuccess: (_, variables) => {
      toast({
        title: `Work Entry ${variables.action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `The work entry has been ${variables.action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });
      setIsVerificationDialogOpen(false);
      setSelectedWorkEntry(null);
      setVerificationNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/company/work-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/work-entries/pending-verification"] });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to process verification",
        variant: "destructive",
      });
    },
  });

  const handleVerifyWork = (workEntry: any) => {
    setSelectedWorkEntry(workEntry);
    setIsVerificationDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getUserRole = () => {
    if (!currentUser || !(currentUser as any)?.id || !Array.isArray(employees)) return 'employee';
    const userEmployee = employees.find((emp: any) => emp.employeeId === (currentUser as any).id);
    return userEmployee?.hierarchyRole || 'employee';
  };

  const canVerifyWork = () => {
    if (!currentUser || !(currentUser as any)?.id || !Array.isArray(employees)) return false;
    const userEmployee = employees.find((emp: any) => emp.employeeId === (currentUser as any).id);
    return userEmployee?.canVerifyWork || false;
  };

  const getFilteredWorkEntries = () => {
    if (!Array.isArray(workEntries)) return [];
    
    return workEntries.filter((entry: any) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (!entry.title?.toLowerCase().includes(searchLower) && 
            !entry.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Status filter
      if (filterStatus !== "all" && entry.status !== filterStatus) {
        return false;
      }
      
      // Employee filter
      if (filterEmployee !== "all" && entry.employeeId !== filterEmployee) {
        return false;
      }
      
      return true;
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="work-verification-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Verification</h1>
          <p className="text-muted-foreground">
            Submit work entries and manage verification workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50">
            {getUserRole().replace('_', ' ')}
          </Badge>
          {canVerifyWork() && (
            <Badge variant="outline" className="bg-green-50">
              Can Verify
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="submit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="submit" data-testid="tab-submit">Submit Work</TabsTrigger>
          <TabsTrigger value="my-entries" data-testid="tab-my-entries">My Entries</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending" disabled={!canVerifyWork()}>
            Pending Verification
            {Array.isArray(pendingVerifications) && pendingVerifications.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {pendingVerifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all-entries" data-testid="tab-all-entries" disabled={!canVerifyWork()}>
            All Entries
          </TabsTrigger>
        </TabsList>

        {/* Submit Work Tab */}
        <TabsContent value="submit" className="space-y-4">
          <Card data-testid="submit-work-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submit Work Entry
              </CardTitle>
              <CardDescription>
                Document your work for verification and tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="work-title">Work Title</Label>
                  <Input
                    id="work-title"
                    value={newWorkEntry.title}
                    onChange={(e) => setNewWorkEntry({ ...newWorkEntry, title: e.target.value })}
                    placeholder="e.g., Feature Development, Bug Fix, Meeting"
                    data-testid="input-work-title"
                  />
                </div>
                <div>
                  <Label htmlFor="work-date">Date</Label>
                  <Input
                    id="work-date"
                    type="date"
                    value={newWorkEntry.date}
                    onChange={(e) => setNewWorkEntry({ ...newWorkEntry, date: e.target.value })}
                    data-testid="input-work-date"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="work-hours">Hours Worked</Label>
                  <Input
                    id="work-hours"
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={newWorkEntry.hoursWorked}
                    onChange={(e) => setNewWorkEntry({ ...newWorkEntry, hoursWorked: parseFloat(e.target.value) || 0 })}
                    data-testid="input-work-hours"
                  />
                </div>
                <div>
                  <Label htmlFor="work-category">Category</Label>
                  <Select value={newWorkEntry.category} onValueChange={(value) => setNewWorkEntry({ ...newWorkEntry, category: value })}>
                    <SelectTrigger data-testid="select-work-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="work-description">Description</Label>
                <Textarea
                  id="work-description"
                  value={newWorkEntry.description}
                  onChange={(e) => setNewWorkEntry({ ...newWorkEntry, description: e.target.value })}
                  placeholder="Describe the work performed, achievements, and any relevant details..."
                  rows={4}
                  data-testid="textarea-work-description"
                />
              </div>

              <Button 
                onClick={() => submitWorkMutation.mutate(newWorkEntry)}
                disabled={!newWorkEntry.title || !newWorkEntry.description || submitWorkMutation.isPending}
                className="w-full"
                data-testid="button-submit-work"
              >
                {submitWorkMutation.isPending ? "Submitting..." : "Submit Work Entry"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Entries Tab */}
        <TabsContent value="my-entries" className="space-y-4">
          <Card data-testid="my-entries-card">
            <CardHeader>
              <CardTitle>My Work Entries</CardTitle>
              <CardDescription>
                Track the status of your submitted work entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workEntriesLoading ? (
                <div className="text-center py-8" data-testid="my-entries-loading">
                  Loading your work entries...
                </div>
              ) : (
                <div className="space-y-3" data-testid="my-entries-list">
                  {Array.isArray(workEntries) && (currentUser as any)?.id && workEntries
                    .filter((entry: any) => entry.employeeId === (currentUser as any).id)
                    .map((entry: any) => (
                    <div key={entry.id} className="p-4 border rounded-lg" data-testid={`my-entry-${entry.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{entry.title}</h4>
                            {getStatusBadge(entry.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{entry.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {entry.hoursWorked}h
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {entry.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="ml-4">
                          {getStatusIcon(entry.status)}
                        </div>
                      </div>
                      
                      {entry.verificationNote && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-blue-200">
                          <p className="text-sm text-gray-700">
                            <strong>Verification Note:</strong> {entry.verificationNote}
                          </p>
                          {entry.verifiedBy && (
                            <p className="text-xs text-gray-500 mt-1">
                              Verified by: {entry.verifiedByName} ({entry.verifiedByRole})
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {(!Array.isArray(workEntries) || !(currentUser as any)?.id || workEntries.filter((e: any) => e.employeeId === (currentUser as any).id).length === 0) && (
                    <div className="text-center py-8 text-muted-foreground" data-testid="no-my-entries">
                      No work entries submitted yet. Create your first entry in the Submit Work tab.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Verification Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card data-testid="pending-verification-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Pending Verification
                {Array.isArray(pendingVerifications) && (
                  <Badge variant="outline">{pendingVerifications.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Work entries requiring your verification approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="text-center py-8" data-testid="pending-loading">
                  Loading pending verifications...
                </div>
              ) : (
                <div className="space-y-3" data-testid="pending-list">
                  {Array.isArray(pendingVerifications) && pendingVerifications.map((entry: any) => (
                    <div key={entry.id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200" data-testid={`pending-entry-${entry.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{entry.title}</h4>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              Pending Review
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{entry.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {entry.employee?.firstName} {entry.employee?.lastName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {entry.hoursWorked}h
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {entry.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyWork(entry)}
                            data-testid={`verify-entry-${entry.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!Array.isArray(pendingVerifications) || pendingVerifications.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground" data-testid="no-pending">
                      No work entries pending verification.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Entries Tab */}
        <TabsContent value="all-entries" className="space-y-4">
          <Card data-testid="all-entries-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Work Entries</CardTitle>
                  <CardDescription>
                    Complete overview of all work entries in your scope
                  </CardDescription>
                </div>
                
                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search entries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="search-all-entries"
                    />
                  </div>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32" data-testid="filter-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {workEntriesLoading ? (
                <div className="text-center py-8" data-testid="all-entries-loading">
                  Loading work entries...
                </div>
              ) : (
                <div className="space-y-3" data-testid="all-entries-list">
                  {getFilteredWorkEntries().map((entry: any) => (
                    <div key={entry.id} className="p-4 border rounded-lg" data-testid={`all-entry-${entry.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{entry.title}</h4>
                            {getStatusBadge(entry.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{entry.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {entry.employee?.firstName} {entry.employee?.lastName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {entry.hoursWorked}h
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {entry.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(entry.status)}
                          {entry.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyWork(entry)}
                              data-testid={`verify-all-entry-${entry.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {entry.verificationNote && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-blue-200">
                          <p className="text-sm text-gray-700">
                            <strong>Verification Note:</strong> {entry.verificationNote}
                          </p>
                          {entry.verifiedBy && (
                            <p className="text-xs text-gray-500 mt-1">
                              Verified by: {entry.verifiedByName} ({entry.verifiedByRole})
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {getFilteredWorkEntries().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground" data-testid="no-all-entries">
                      {searchQuery || filterStatus !== "all" ? 
                        "No entries match your search criteria." :
                        "No work entries found."
                      }
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verification Dialog */}
      <Dialog open={isVerificationDialogOpen} onOpenChange={setIsVerificationDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="verification-dialog">
          <DialogHeader>
            <DialogTitle>Verify Work Entry</DialogTitle>
            <DialogDescription>
              Review and approve or reject this work entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedWorkEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">{selectedWorkEntry.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{selectedWorkEntry.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Employee:</span><br />
                    <span className="font-medium">
                      {selectedWorkEntry.employee?.firstName} {selectedWorkEntry.employee?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span><br />
                    <span className="font-medium">
                      {new Date(selectedWorkEntry.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hours:</span><br />
                    <span className="font-medium">{selectedWorkEntry.hoursWorked}h</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span><br />
                    <Badge variant="outline">{selectedWorkEntry.category}</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="verification-note">Verification Note</Label>
                <Textarea
                  id="verification-note"
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="Add comments about this work entry verification..."
                  rows={3}
                  data-testid="textarea-verification-note"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => verifyWorkMutation.mutate({
                    workEntryId: selectedWorkEntry.id,
                    action: 'approve',
                    note: verificationNote
                  })}
                  disabled={verifyWorkMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-approve-work"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {verifyWorkMutation.isPending ? "Processing..." : "Approve"}
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => verifyWorkMutation.mutate({
                    workEntryId: selectedWorkEntry.id,
                    action: 'reject',
                    note: verificationNote
                  })}
                  disabled={verifyWorkMutation.isPending}
                  className="flex-1"
                  data-testid="button-reject-work"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {verifyWorkMutation.isPending ? "Processing..." : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}