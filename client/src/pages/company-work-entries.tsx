import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Clock, Calendar, User, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type WorkEntryStatus = "pending" | "approved" | "needs_changes";

interface WorkEntry {
  id: string;
  employeeId: string;
  companyId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  priority: string;
  hours: number | null;
  status: WorkEntryStatus;
  companyFeedback: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function CompanyWorkEntries() {
  const { toast } = useToast();
  const [selectedEntry, setSelectedEntry] = useState<WorkEntry | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Fetch all work entries for the company
  const { data: allWorkEntries = [], isLoading: loadingAll } = useQuery<WorkEntry[]>({
    queryKey: ['/api/company/work-entries'],
  });

  // Fetch pending work entries
  const { data: pendingEntries = [], isLoading: loadingPending } = useQuery<WorkEntry[]>({
    queryKey: ['/api/company/work-entries/pending'],
  });

  // Fetch employees to get names
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/company/employees'],
  });

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  };

  const approveMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await fetch(`/api/company/work-entries/${entryId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to approve work entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company/work-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/work-entries/pending'] });
      toast({
        title: "Success",
        description: "Work entry approved successfully",
      });
      setShowApprovalDialog(false);
      setSelectedEntry(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve work entry",
        variant: "destructive",
      });
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: async ({ entryId, feedback }: { entryId: string; feedback: string }) => {
      const response = await fetch(`/api/company/work-entries/${entryId}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (!response.ok) throw new Error('Failed to request changes');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company/work-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/work-entries/pending'] });
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

  const handleApprove = (entry: WorkEntry) => {
    setSelectedEntry(entry);
    setShowApprovalDialog(true);
  };

  const handleRequestChanges = (entry: WorkEntry) => {
    setSelectedEntry(entry);
    setShowChangesDialog(true);
  };

  const confirmApproval = () => {
    if (selectedEntry) {
      approveMutation.mutate(selectedEntry.id);
    }
  };

  const confirmRequestChanges = () => {
    if (selectedEntry && feedback.trim()) {
      requestChangesMutation.mutate({ entryId: selectedEntry.id, feedback });
    }
  };

  const getStatusBadge = (status: WorkEntryStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'needs_changes':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Needs Changes</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const WorkEntryCard = ({ entry, showActions = false }: { entry: WorkEntry; showActions?: boolean }) => (
    <Card key={entry.id} className="mb-4" data-testid={`work-entry-card-${entry.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold" data-testid={`work-entry-title-${entry.id}`}>
              {entry.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4" />
              <span data-testid={`employee-name-${entry.id}`}>{getEmployeeName(entry.employeeId)}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(entry.status)}
            {getPriorityBadge(entry.priority)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entry.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description:</p>
              <p className="text-sm" data-testid={`work-entry-description-${entry.id}`}>{entry.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Start Date:</p>
              <p className="flex items-center gap-1" data-testid={`work-entry-start-date-${entry.id}`}>
                <Calendar className="w-3 h-3" />
                {entry.startDate}
              </p>
            </div>
            {entry.endDate && (
              <div>
                <p className="text-muted-foreground">End Date:</p>
                <p className="flex items-center gap-1" data-testid={`work-entry-end-date-${entry.id}`}>
                  <Calendar className="w-3 h-3" />
                  {entry.endDate}
                </p>
              </div>
            )}
          </div>

          {entry.hours && (
            <div>
              <p className="text-muted-foreground text-sm">Hours:</p>
              <p className="text-sm" data-testid={`work-entry-hours-${entry.id}`}>{entry.hours} hours</p>
            </div>
          )}

          {entry.companyFeedback && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800 mb-1">Company Feedback:</p>
              <p className="text-sm text-yellow-700" data-testid={`work-entry-feedback-${entry.id}`}>{entry.companyFeedback}</p>
            </div>
          )}

          {showActions && entry.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => handleApprove(entry)}
                className="bg-green-600 hover:bg-green-700"
                data-testid={`approve-button-${entry.id}`}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button 
                onClick={() => handleRequestChanges(entry)}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                data-testid={`request-changes-button-${entry.id}`}
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                Request Changes
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Work Entry Reviews</h1>
        <p className="text-muted-foreground">
          Review and verify work entries submitted by your employees
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pendingEntries.length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            All Entries ({allWorkEntries.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" data-testid="tab-reviewed">
            Reviewed ({allWorkEntries.filter(e => e.status !== 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {loadingPending ? (
            <div className="text-center py-8" data-testid="loading-pending">Loading pending entries...</div>
          ) : pendingEntries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Entries</h3>
                <p className="text-muted-foreground">
                  All work entries have been reviewed. New submissions will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingEntries.map(entry => (
                <WorkEntryCard key={entry.id} entry={entry} showActions={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {loadingAll ? (
            <div className="text-center py-8" data-testid="loading-all">Loading all entries...</div>
          ) : allWorkEntries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Work Entries</h3>
                <p className="text-muted-foreground">
                  No work entries have been submitted yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allWorkEntries.map(entry => (
                <WorkEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="mt-6">
          {loadingAll ? (
            <div className="text-center py-8" data-testid="loading-reviewed">Loading reviewed entries...</div>
          ) : (
            <div className="space-y-4">
              {allWorkEntries
                .filter(entry => entry.status !== 'pending')
                .map(entry => (
                  <WorkEntryCard key={entry.id} entry={entry} />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approval Confirmation Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent data-testid="approval-dialog">
          <DialogHeader>
            <DialogTitle>Approve Work Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this work entry? This action confirms that the work was completed as described.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="py-4">
              <h4 className="font-semibold">{selectedEntry.title}</h4>
              <p className="text-sm text-muted-foreground">
                Submitted by: {getEmployeeName(selectedEntry.employeeId)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)} data-testid="cancel-approval">
              Cancel
            </Button>
            <Button 
              onClick={confirmApproval}
              className="bg-green-600 hover:bg-green-700"
              disabled={approveMutation.isPending}
              data-testid="confirm-approval"
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <DialogContent data-testid="request-changes-dialog">
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Provide feedback to the employee about what needs to be changed or corrected in their work entry.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="py-4">
              <h4 className="font-semibold">{selectedEntry.title}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Submitted by: {getEmployeeName(selectedEntry.employeeId)}
              </p>
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback for Employee</Label>
                <Textarea
                  id="feedback"
                  placeholder="Explain what needs to be changed or provide specific feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  data-testid="feedback-textarea"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangesDialog(false)} data-testid="cancel-changes">
              Cancel
            </Button>
            <Button 
              onClick={confirmRequestChanges}
              disabled={requestChangesMutation.isPending || !feedback.trim()}
              data-testid="confirm-changes"
            >
              {requestChangesMutation.isPending ? 'Sending...' : 'Request Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}