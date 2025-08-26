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
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, Clock, Calendar, User, Users, Building, ArrowLeft, Building2, Lock, Star, Briefcase, Target, DollarSign, Tag, Trophy, BookOpen, AlertTriangle, FileText, Paperclip, Shield, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CompanyNavHeader from '@/components/company-nav-header';

type ApprovalStatus = "pending_review" | "approved" | "needs_changes";
type EmployeeTaskStatus = "pending" | "in_progress" | "completed" | "on_hold" | "cancelled";

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
  status: EmployeeTaskStatus; // Employee's task status
  approvalStatus: ApprovalStatus; // Company's approval status
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
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');

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
      pendingCount: data.entries.filter((e: any) => e.approvalStatus === 'pending_review').length,
      approvedCount: data.entries.filter((e: any) => e.approvalStatus === 'approved').length,
      needsChangesCount: data.entries.filter((e: any) => e.approvalStatus === 'needs_changes').length
    }));
  };

  // Combine all entries and pending entries for complete view
  const allEntriesForDisplay = [...allWorkEntries, ...pendingEntries];
  const employeeGroups = groupEntriesByEmployee(allEntriesForDisplay);
  
  // Filter employee groups based on search query
  const filteredEmployeeGroups = employeeGroups.filter(group => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const employeeName = getEmployeeName({ employeeName: group.employee?.firstName + ' ' + group.employee?.lastName }).toLowerCase();
    const employeeEmail = (group.employee?.email || '').toLowerCase();
    
    return employeeName.includes(query) || employeeEmail.includes(query);
  });
  const selectedEmployeeEntries = selectedEmployeeId 
    ? allEntriesForDisplay.filter(entry => entry.employeeId === selectedEmployeeId)
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

  const getStatusBadge = (approvalStatus: ApprovalStatus, entry?: any) => {
    switch (approvalStatus) {
      case 'pending_review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        // Show "Verified by Company" badge for all approved entries (company admin or manager approval)
        const verifierName = entry?.verifiedByName || 'Company Admin';
        const isManagerVerified = entry?.verifiedByRole === 'assigned_manager';
        return (
          <Badge variant="default" className="bg-green-600 text-white">
            <Shield className="w-3 h-3 mr-1" />
            Verified by Company
            {isManagerVerified && (
              <span className="ml-1 text-xs opacity-80">({verifierName})</span>
            )}
          </Badge>
        );
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
            {getStatusBadge(entry.approvalStatus, entry)}
            {getPriorityBadge(entry.priority)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Employee Submission Summary */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Employee Submission Overview
            </h4>
            <div className="text-sm text-amber-900 dark:text-amber-100 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>Submitted: {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'N/A'}</div>
              {entry.updatedAt !== entry.createdAt && (
                <div>Updated: {entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : 'N/A'}</div>
              )}
              <div>Work Type: <span className="font-medium">{entry.workType || 'task'}</span></div>
              <div>Status: <span className="font-medium capitalize">{entry.status || 'pending'}</span></div>
            </div>
          </div>

          {/* Basic Information Section */}
          <div>
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Work Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-muted-foreground">Work Type:</p>
                <Badge variant="outline" className="flex w-fit items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {entry.workType || 'task'}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">Employee Status:</p>
                <Badge variant="outline" className={`flex w-fit items-center gap-1 ${
                  entry.status === 'completed' ? 'bg-green-50 text-green-700' : 
                  entry.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                  entry.status === 'on_hold' ? 'bg-orange-50 text-orange-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  <Clock className="w-3 h-3" />
                  {entry.status || 'pending'}
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
                  <p className="font-medium text-blue-600 dark:text-blue-400">{entry.project}</p>
                </div>
              )}
              {/* Client information is excluded from company view for privacy */}
            </div>
          </div>

          {/* Description */}
          {entry.description && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Work Description
              </h4>
              <div className="text-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800" data-testid={`work-entry-description-${entry.id}`}>
                <div className="whitespace-pre-wrap text-blue-900 dark:text-blue-100 leading-relaxed break-words overflow-wrap-anywhere">
                  {entry.description}
                </div>
              </div>
            </div>
          )}
          
          {/* Timeline & Hours Section */}
          <div>
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeline & Hours
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                <p className="text-muted-foreground">Start Date:</p>
                <p className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400" data-testid={`work-entry-start-date-${entry.id}`}>
                  <Calendar className="w-3 h-3" />
                  {entry.startDate}
                </p>
              </div>
              {entry.endDate && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-muted-foreground">End Date:</p>
                  <p className="flex items-center gap-1 font-medium text-red-600 dark:text-red-400" data-testid={`work-entry-end-date-${entry.id}`}>
                    <Calendar className="w-3 h-3" />
                    {entry.endDate}
                  </p>
                </div>
              )}
              {entry.estimatedHours && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-muted-foreground">Estimated:</p>
                  <p className="font-medium text-blue-600 dark:text-blue-400">{entry.estimatedHours}h</p>
                </div>
              )}
              {entry.actualHours && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="text-muted-foreground">Actual:</p>
                  <p className="font-medium text-green-600 dark:text-green-400">{entry.actualHours}h</p>
                </div>
              )}
              {entry.hours && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <p className="text-muted-foreground">Total:</p>
                  <p className="font-medium text-purple-600 dark:text-purple-400" data-testid={`work-entry-hours-${entry.id}`}>{entry.hours}h</p>
                </div>
              )}
            </div>
          </div>

          {/* Billing Information */}
          {(entry.billable || entry.billableRate) && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Billing Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Billable Work:</p>
                  <Badge variant={entry.billable ? "default" : "secondary"} className={`mt-1 ${entry.billable ? 'bg-green-600 text-white' : ''}`}>
                    {entry.billable ? "✓ Billable" : "Not Billable"}
                  </Badge>
                </div>
                {entry.billableRate && (
                  <div>
                    <p className="text-muted-foreground">Hourly Rate:</p>
                    <p className="font-bold text-green-700 dark:text-green-300 text-lg">${entry.billableRate}/hour</p>
                    {(entry.actualHours || entry.estimatedHours) && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Est. Value: ${entry.billableRate * (entry.actualHours || entry.estimatedHours || 0)}
                      </p>
                    )}
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
          {entry.challenges && entry.challenges.trim() && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Challenges Faced
              </h4>
              <p className="text-sm bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-orange-800 dark:text-orange-200 whitespace-pre-wrap">
                {entry.challenges}
              </p>
            </div>
          )}
          
          {/* Show message when challenges field is empty */}
          {(!entry.challenges || !entry.challenges.trim()) && (
            <div className="text-sm text-gray-500 italic p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              Employee did not specify challenges for this work entry
            </div>
          )}

          {/* Learnings */}
          {entry.learnings && entry.learnings.trim() && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Key Learnings
              </h4>
              <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                {entry.learnings}
              </p>
            </div>
          )}
          
          {/* Show message when learnings field is empty */}
          {(!entry.learnings || !entry.learnings.trim()) && (
            <div className="text-sm text-gray-500 italic p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              Employee did not specify key learnings for this work entry
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

          {/* Action Buttons - Only show for pending entries */}
          {showActions && entry.approvalStatus === 'pending_review' && entry.status !== 'approved' && (
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={() => handleApprove(entry)}
                className="bg-green-600 hover:bg-green-700"
                data-testid={`approve-button-${entry.id}`}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve & Lock Entry
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
          {(entry.approvalStatus === 'approved' || entry.status === 'approved') && (
            <div className="flex items-center gap-2 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Company Verified</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Entry Locked & Immutable</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <CompanyNavHeader />

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Work Entry Reviews</h1>
              <p className="text-muted-foreground">
                Review and verify work entries submitted by your employees
              </p>
            </div>
            <div className="text-right">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {pendingEntries.length}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Pending Reviews</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar - only show in employee list view */}
        {viewMode === 'employees' && (
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search employees by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-employees-input"
              />
            </div>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="text-gray-500 hover:text-gray-700"
                data-testid="clear-search-button"
              >
                Clear
              </Button>
            )}
          </div>
        )}

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
            {(loadingAll || loadingPending) ? (
              <div className="text-center py-8" data-testid="loading-employees">Loading employees...</div>
            ) : filteredEmployeeGroups.length === 0 && searchQuery ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No employees found</h3>
                  <p className="text-muted-foreground">
                    No employees match your search for "{searchQuery}"
                  </p>
                </CardContent>
              </Card>
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
                {filteredEmployeeGroups.map(({ employeeId, employee, totalCount, pendingCount, approvedCount, needsChangesCount }) => (
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
                Pending ({selectedEmployeeEntries.filter(e => e.approvalStatus === 'pending_review').length})
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">
                All ({selectedEmployeeEntries.length})
              </TabsTrigger>
              <TabsTrigger value="reviewed" data-testid="tab-reviewed">
                Reviewed ({selectedEmployeeEntries.filter(e => e.approvalStatus !== 'pending_review').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {selectedEmployeeEntries.filter(e => e.approvalStatus === 'pending_review').length === 0 ? (
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
                    .filter(entry => entry.approvalStatus === 'pending_review')
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
              {selectedEmployeeEntries.filter(e => e.approvalStatus !== 'pending_review').length === 0 ? (
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
                    .filter(entry => entry.approvalStatus !== 'pending_review')
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
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" data-testid="approval-dialog">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Review & Approve Work Entry</DialogTitle>
            <DialogDescription>
              Rate the quality of work and provide feedback to help the employee grow.
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {selectedEntry && (
              <div className="space-y-6 py-4">
                {/* Work Entry Info */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg break-words overflow-wrap-anywhere">{selectedEntry.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Submitted by: {getEmployeeName(selectedEntry)}
                  </p>
                  {selectedEntry.description && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description:</p>
                      <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap max-w-full">
                        {selectedEntry.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5-Star Rating System */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Rate this work (optional)</Label>
                  <div className="flex items-center space-x-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110 p-1"
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
          </div>
          
          {/* Fixed Footer */}
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
              {approveMutation.isPending ? 'Approving...' : 'Approve & Lock Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
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
                <h4 className="font-semibold break-words">{selectedEntry.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Submitted by: {getEmployeeName(selectedEntry)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback for Employee</Label>
                <Textarea
                  id="feedback"
                  placeholder="Explain what needs to be changed or provide specific feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="resize-none"
                  data-testid="feedback-textarea"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
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
              disabled={requestChangesMutation.isPending || !feedback.trim()}
              className="w-full sm:w-auto"
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