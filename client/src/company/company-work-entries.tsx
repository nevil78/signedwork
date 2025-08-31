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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle, Clock, Calendar, User, Users, Building, ArrowLeft, Building2, Lock, Star, Briefcase, Target, DollarSign, Tag, Trophy, BookOpen, AlertTriangle, FileText, Paperclip, Shield, Search, Filter, Settings, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CompanyNavHeader from '@/components/company-nav-header';
import { useAuth } from "@/hooks/useAuth";
import { CompanyVerificationBadge } from "@/components/CompanyVerificationBadge";

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
  const { user: authUser } = useAuth(); // Get company verification status
  const [selectedEntry, setSelectedEntry] = useState<WorkEntry | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  // Rating system state variables
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [approvalFeedback, setApprovalFeedback] = useState('');
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});

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

  // Check company verification status for security gates
  const isCompanyVerified = authUser?.verificationStatus === 'verified';
  const companyVerificationStatus = authUser?.verificationStatus || 'unverified';
  
  // Check work diary access control - Premium feature gated by admin
  const workDiaryAccess = authUser?.workDiaryAccess || false;


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
  
  // Enhanced filtering logic
  const filteredEmployeeGroups = employeeGroups.filter(group => {
    // Filter by selected employee
    if (selectedEmployeeFilter !== 'all' && group.employeeId !== selectedEmployeeFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const employeeName = getEmployeeName({ employeeName: group.employee?.firstName + ' ' + group.employee?.lastName }).toLowerCase();
      const employeeEmail = (group.employee?.email || '').toLowerCase();
      const entryTitleMatch = group.entries.some((entry: any) => 
        entry.title.toLowerCase().includes(query) ||
        entry.description?.toLowerCase().includes(query)
      );
      
      return employeeName.includes(query) || employeeEmail.includes(query) || entryTitleMatch;
    }
    
    return true;
  });

  // Get unique employees for dropdown
  const employeeOptions = employeeGroups.map(group => ({
    id: group.employeeId,
    name: getEmployeeName({ employeeName: group.employee?.firstName + ' ' + group.employee?.lastName }),
    entryCount: group.totalCount
  }));

  // Toggle employee expansion
  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

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
              {/* 🚨 SECURITY: Only verified companies can approve work entries */}
              {!isCompanyVerified && (
                <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Verification Required</span>
                  </div>
                  <p className="text-xs text-red-700 mb-3">
                    Complete company verification to approve work entries and prevent fraudulent self-verification.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled
                      className="opacity-50 cursor-not-allowed bg-gray-300 text-gray-500"
                      data-testid={`approve-button-disabled-${entry.id}`}
                      title="Company verification required to approve work entries"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve & Lock Entry
                    </Button>
                    <Button
                      size="sm"
                      disabled
                      variant="outline"
                      className="opacity-50 cursor-not-allowed border-gray-300 text-gray-500"
                      data-testid={`request-changes-button-disabled-${entry.id}`}
                      title="Company verification required to request changes"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Request Changes
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Normal approval buttons for verified companies */}
              {isCompanyVerified && (
                <>
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
                </>
              )}
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

  // If work diary access is disabled, show locked page
  if (!workDiaryAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation Header */}
        <CompanyNavHeader />

        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-2xl border-2 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 p-4 bg-orange-100 dark:bg-orange-900/40 rounded-full w-20 h-20 flex items-center justify-center">
                  <Lock className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                  Work Diary Access Pending
                </CardTitle>
                <CardDescription className="text-lg text-orange-700 dark:text-orange-300 mt-2">
                  Your work diary access is currently disabled
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-700">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      📋 Document Verification Required
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Our admin team is currently reviewing your company documents:
                    </p>
                    <div className="mt-3 flex justify-center space-x-4 text-xs">
                      <Badge variant="outline">PAN Verification</Badge>
                      <Badge variant="outline">CIN Verification</Badge>
                      <Badge variant="outline">GST Verification</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      🔐 Premium Feature Access
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Work diary access will be enabled once our admin team completes the verification 
                      of your business documents and approves your company profile.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      ⏰ What Happens Next?
                    </h3>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 text-left">
                      <li>• Admin reviews your PAN, CIN, and GST documents</li>
                      <li>• If documents are verified, admin will enable work diary access</li>
                      <li>• You'll receive access to track and manage employee work entries</li>
                      <li>• This typically takes 1-2 business days</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-orange-200 dark:border-orange-700">
                  <p className="text-sm text-orange-600 dark:text-orange-400 mb-4">
                    Questions about verification status? Contact our support team.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/company")}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/30"
                    data-testid="button-back-to-dashboard"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Enhanced Search and Filter Controls */}
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
                    <Search className="h-4 w-4 text-gray-400" />
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
                <Select value={selectedEmployeeFilter} onValueChange={setSelectedEmployeeFilter}>
                  <SelectTrigger data-testid="select-employee-filter">
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees ({employeeGroups.length})</SelectItem>
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
                variant={selectedEmployeeFilter === 'all' && !searchTerm ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedEmployeeFilter('all');
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
                  const allEmployeeIds = employeeGroups.map(g => g.employeeId);
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


        {/* 🚨 SECURITY WARNING: Company Verification Required */}
        {!isCompanyVerified && (
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    🔒 Company Verification Required
                  </h3>
                  <p className="text-red-800 mb-4">
                    Your company must be verified before you can approve work entries. This security measure prevents fraudulent self-verification schemes.
                  </p>
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="text-sm font-medium text-red-900">Current Status:</span>
                    <CompanyVerificationBadge status={companyVerificationStatus as any} size="sm" />
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/company-settings')}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      data-testid="button-goto-verification"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Complete Verification
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open('/help/verification', '_blank')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid="button-verification-help"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Work Entries List - Grouped by Employee */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Work Entries by Employee</h2>
            <div className="space-y-6">
              {(loadingAll || loadingPending) ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Loading work entries...</p>
                  </CardContent>
                </Card>
              ) : filteredEmployeeGroups.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {searchTerm || selectedEmployeeFilter !== 'all' 
                        ? 'No work entries match your search criteria.' 
                        : 'No work entries found for any employees.'}
                    </p>
                    {(searchTerm || selectedEmployeeFilter !== 'all') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedEmployeeFilter('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredEmployeeGroups.map(({ employeeId, employee, entries, pendingCount, approvedCount, needsChangesCount }) => {
                  const isExpanded = expandedEmployees[employeeId];
                  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
                  
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
                              {employeeName.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{employeeName}</h3>
                              <p className="text-sm text-gray-600">{employee?.email || 'No email'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {pendingCount > 0 && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                                  {pendingCount} pending
                                </Badge>
                              )}
                              {approvedCount > 0 && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  {approvedCount} approved
                                </Badge>
                              )}
                              {needsChangesCount > 0 && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                                  {needsChangesCount} changes
                                </Badge>
                              )}
                            </div>
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
                          {entries.map((entry: any, index: number) => (
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
                                      {Array.from({ length: 5 }, (_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`w-3 h-3 ${i < entry.companyRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                        />
                                      ))}
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

          {/* Enhanced Entry Details and Approval */}
          {selectedEntry && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Entry Details</h2>
              <WorkEntryCard entry={selectedEntry} showActions={selectedEntry.approvalStatus === 'pending_review'} />
            </div>
          )}
        </div>

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