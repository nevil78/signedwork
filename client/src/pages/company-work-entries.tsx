import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Clock, Calendar, User, Users, Building, ArrowLeft, Building2, Lock, Star, Briefcase, Target, DollarSign, Tag, Trophy, BookOpen, AlertTriangle, FileText, Paperclip } from 'lucide-react';
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
  estimatedHours: number | null;
  actualHours: number | null;
  status: WorkEntryStatus;
  workType: string;
  category: string | null;
  project: string | null;
  client: string | null;
  billable: boolean;
  billableRate: number | null;
  tags: string[];
  achievements: string[];
  challenges: string | null;
  learnings: string | null;
  companyFeedback: string | null;
  companyRating: number | null;
  attachments: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
  employeeName?: string;
  employeeEmail?: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function CompanyWorkEntries() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [selectedEntry, setSelectedEntry] = useState<WorkEntry | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'employees' | 'entries'>('employees');
  // Rating system state variables
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [approvalFeedback, setApprovalFeedback] = useState('');

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

  // Logout mutation
  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return response.json();
    },
    onSuccess: () => {
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    },
  });

  const getEmployeeName = (entry: any) => {
    return entry.employeeName || 'Unknown Employee';
  };

  // Group entries by employee for organized view
  const groupEntriesByEmployee = (entries: any[]) => {
    const grouped = entries.reduce((acc, entry) => {
      if (!acc[entry.employeeId]) {
        acc[entry.employeeId] = {
          employee: {
            id: entry.employeeId,
            firstName: entry.employeeName?.split(' ')[0] || '',
            lastName: entry.employeeName?.split(' ').slice(1).join(' ') || '',
            email: entry.employeeEmail || ''
          },
          entries: []
        };
      }
      acc[entry.employeeId].entries.push(entry);
      return acc;
    }, {} as Record<string, { employee?: any; entries: any[] }>);

    return Object.entries(grouped).map(([employeeId, data]) => ({
      employeeId,
      employee: data.employee,
      entries: data.entries,
      totalCount: data.entries.length,
      pendingCount: data.entries.filter(e => e.status === 'pending').length,
      approvedCount: data.entries.filter(e => e.status === 'approved').length,
      needsChangesCount: data.entries.filter(e => e.status === 'needs_changes').length
    }));
  };

  const employeeGroups = groupEntriesByEmployee(allWorkEntries);
  const selectedEmployeeEntries = selectedEmployeeId 
    ? allWorkEntries.filter(entry => entry.employeeId === selectedEmployeeId)
    : [];
  const selectedEmployeeName = selectedEmployeeId 
    ? (selectedEmployeeEntries.length > 0 ? getEmployeeName(selectedEmployeeEntries[0]) : 'Unknown Employee')
    : '';

  const approveMutation = useMutation({
    mutationFn: async ({ entryId, rating, feedback }: { entryId: string; rating: number; feedback: string }) => {
      const response = await fetch(`/api/company/work-entries/${entryId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rating: rating || undefined, 
          feedback: feedback || undefined 
        }),
      });
      if (!response.ok) throw new Error('Failed to approve work entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company/work-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/work-entries/pending'] });
      toast({
        title: "Success",
        description: `Work entry approved successfully${rating > 0 ? ` with ${rating}-star rating` : ''}`,
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
    setRating(0);
    setApprovalFeedback('');
    setShowApprovalDialog(true);
  };

  const handleRequestChanges = (entry: WorkEntry) => {
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
    <Card key={entry.id} className="mb-6" data-testid={`work-entry-card-${entry.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold" data-testid={`work-entry-title-${entry.id}`}>
              {entry.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4" />
              <span data-testid={`employee-name-${entry.id}`}>{getEmployeeName(entry)}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(entry.status)}
            {getPriorityBadge(entry.priority)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div>
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Work Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-muted-foreground">Work Type:</p>
                <Badge variant="outline" className="flex w-fit items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {entry.workType || 'task'}
                </Badge>
              </div>
              {entry.category && (
                <div className="space-y-2">
                  <p className="text-muted-foreground">Category:</p>
                  <Badge variant="secondary" className="flex w-fit items-center gap-1">
                    <Target className="w-3 h-3" />
                    {entry.category}
                  </Badge>
                </div>
              )}
              {entry.project && (
                <div className="space-y-2">
                  <p className="text-muted-foreground">Project:</p>
                  <p className="font-medium">{entry.project}</p>
                </div>
              )}
              {entry.client && (
                <div className="space-y-2">
                  <p className="text-muted-foreground">Client:</p>
                  <p className="font-medium">{entry.client}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {entry.description && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Description:</h4>
              <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg" data-testid={`work-entry-description-${entry.id}`}>
                {entry.description}
              </p>
            </div>
          )}
          
          {/* Timeline & Hours Section */}
          <div>
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeline & Hours
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Start Date:</p>
                <p className="flex items-center gap-1 font-medium" data-testid={`work-entry-start-date-${entry.id}`}>
                  <Calendar className="w-3 h-3" />
                  {entry.startDate}
                </p>
              </div>
              {entry.endDate && (
                <div>
                  <p className="text-muted-foreground">End Date:</p>
                  <p className="flex items-center gap-1 font-medium" data-testid={`work-entry-end-date-${entry.id}`}>
                    <Calendar className="w-3 h-3" />
                    {entry.endDate}
                  </p>
                </div>
              )}
              {entry.estimatedHours && (
                <div>
                  <p className="text-muted-foreground">Estimated Hours:</p>
                  <p className="font-medium">{entry.estimatedHours}h</p>
                </div>
              )}
              {entry.actualHours && (
                <div>
                  <p className="text-muted-foreground">Actual Hours:</p>
                  <p className="font-medium">{entry.actualHours}h</p>
                </div>
              )}
              {entry.hours && (
                <div>
                  <p className="text-muted-foreground">Total Hours:</p>
                  <p className="font-medium" data-testid={`work-entry-hours-${entry.id}`}>{entry.hours}h</p>
                </div>
              )}
            </div>
          </div>

          {/* Billing Information */}
          {(entry.billable || entry.billableRate) && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Billing Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Billable:</p>
                  <Badge variant={entry.billable ? "default" : "secondary"} className="mt-1">
                    {entry.billable ? "Yes" : "No"}
                  </Badge>
                </div>
                {entry.billableRate && (
                  <div>
                    <p className="text-muted-foreground">Hourly Rate:</p>
                    <p className="font-medium">${entry.billableRate}/hour</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {entry.achievements && entry.achievements.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Key Achievements
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                {entry.achievements.map((achievement, index) => (
                  <li key={index} className="text-green-800 dark:text-green-200">
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Challenges */}
          {entry.challenges && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Challenges Faced
              </h4>
              <p className="text-sm bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-orange-800 dark:text-orange-200">
                {entry.challenges}
              </p>
            </div>
          )}

          {/* Learnings */}
          {entry.learnings && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Key Learnings
              </h4>
              <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-blue-800 dark:text-blue-200">
                {entry.learnings}
              </p>
            </div>
          )}

          {/* Attachments */}
          {entry.attachments && entry.attachments.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attachments
              </h4>
              <div className="space-y-2">
                {entry.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <Paperclip className="w-3 h-3" />
                    <span className="text-sm">{attachment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company Feedback Section */}
          {entry.companyFeedback && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Company Feedback</p>
                {entry.companyRating && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= entry.companyRating!
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300" data-testid={`work-entry-feedback-${entry.id}`}>
                {entry.companyFeedback}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && entry.status === 'pending' && (
            <div className="flex gap-2 pt-4 border-t">
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
          
          {/* Show immutable message for approved entries */}
          {entry.status === 'approved' && (
            <div className="flex items-center gap-2 pt-4 border-t text-green-600 text-sm">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Entry Verified & Locked - No further changes allowed</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/company-dashboard')}
                className="mr-4"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Building2 className="text-primary text-2xl mr-3" />
              <span className="text-xl font-bold text-slate-800 dark:text-slate-200">Work Entry Reviews</span>
            </div>
            <Button
              variant="outline"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              data-testid="button-logout"
            >
              {logout.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Work Entry Reviews</h1>
          <p className="text-muted-foreground">
            Review and verify work entries submitted by your employees
          </p>
        </div>

        {/* Navigation breadcrumb */}
        {viewMode === 'entries' && selectedEmployeeId && (
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => {
                setViewMode('employees');
                setSelectedEmployeeId(null);
              }}
              className="mb-4"
              data-testid="button-back-employees"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Employee List
            </Button>
            <h2 className="text-2xl font-semibold" data-testid="selected-employee-title">
              Work Entries for {selectedEmployeeName}
            </h2>
          </div>
        )}

        {viewMode === 'employees' ? (
          /* Employee List View */
          <div className="space-y-4">
            {loadingAll ? (
              <div className="text-center py-8" data-testid="loading-employees">Loading employees...</div>
            ) : employeeGroups.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Work Entries</h3>
                  <p className="text-muted-foreground">
                    No work entries have been submitted yet by any employees.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {employeeGroups.map(({ employeeId, employee, totalCount, pendingCount, approvedCount, needsChangesCount }) => (
                  <Card 
                    key={employeeId} 
                    className="cursor-pointer hover:shadow-lg transition-shadow" 
                    onClick={() => {
                      setSelectedEmployeeId(employeeId);
                      setViewMode('entries');
                    }}
                    data-testid={`employee-entries-card-${employeeId}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-semibold text-primary hover:underline" data-testid={`employee-entries-name-${employeeId}`}>
                            {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <User className="w-4 h-4" />
                            <span data-testid={`employee-entries-email-${employeeId}`}>
                              {employee?.email || 'No email available'}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700" data-testid={`employee-entries-total-${employeeId}`}>
                            {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">Pending</span>
                          </div>
                          <div className="text-xl font-bold text-yellow-700" data-testid={`employee-pending-count-${employeeId}`}>
                            {pendingCount}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-800">Approved</span>
                          </div>
                          <div className="text-xl font-bold text-green-700" data-testid={`employee-approved-count-${employeeId}`}>
                            {approvedCount}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-800">Changes</span>
                          </div>
                          <div className="text-xl font-bold text-red-700" data-testid={`employee-changes-count-${employeeId}`}>
                            {needsChangesCount}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Individual Employee Entries View */
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pending ({selectedEmployeeEntries.filter(e => e.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">
                All ({selectedEmployeeEntries.length})
              </TabsTrigger>
              <TabsTrigger value="reviewed" data-testid="tab-reviewed">
                Reviewed ({selectedEmployeeEntries.filter(e => e.status !== 'pending').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {selectedEmployeeEntries.filter(e => e.status === 'pending').length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Entries</h3>
                    <p className="text-muted-foreground">
                      This employee has no pending work entries to review.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {selectedEmployeeEntries
                    .filter(entry => entry.status === 'pending')
                    .map(entry => (
                      <WorkEntryCard key={entry.id} entry={entry} showActions={true} />
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              {selectedEmployeeEntries.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Work Entries</h3>
                    <p className="text-muted-foreground">
                      This employee hasn't submitted any work entries yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {selectedEmployeeEntries.map(entry => (
                    <WorkEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviewed" className="mt-6">
              {selectedEmployeeEntries.filter(e => e.status !== 'pending').length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reviewed Entries</h3>
                    <p className="text-muted-foreground">
                      This employee has no reviewed work entries yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {selectedEmployeeEntries
                    .filter(entry => entry.status !== 'pending')
                    .map(entry => (
                      <WorkEntryCard key={entry.id} entry={entry} />
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

      {/* Enhanced Approval Dialog with Rating System */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md" data-testid="approval-dialog">
          <DialogHeader>
            <DialogTitle>Review & Approve Work Entry</DialogTitle>
            <DialogDescription>
              Rate the quality of work and provide feedback to help the employee grow.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-6">
              {/* Work Entry Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg">{selectedEntry.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Submitted by: {getEmployeeName(selectedEntry)}
                </p>
                {selectedEntry.description && (
                  <p className="text-sm text-gray-700 mt-2">{selectedEntry.description}</p>
                )}
              </div>

              {/* 5-Star Rating System */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Rate this work (optional)</Label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                      data-testid={`star-${star}`}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-3 text-sm text-gray-600">
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
                  rows={4}
                  className="resize-none"
                  data-testid="approval-feedback-textarea"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowApprovalDialog(false)} 
              data-testid="cancel-approval"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmApproval}
              className="bg-green-600 hover:bg-green-700"
              disabled={approveMutation.isPending}
              data-testid="confirm-approval"
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve Work'}
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
    </div>
  );
}