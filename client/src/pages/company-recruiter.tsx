import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button
} from '@/components/ui/button';
import {
  Badge
} from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Textarea
} from '@/components/ui/textarea';
import {
  Label
} from '@/components/ui/label';
import {
  Input
} from '@/components/ui/input';
import {
  Building2, Users, Eye, Star, MessageSquare, Calendar,
  User, LogOut, Briefcase, ChevronRight, FileText, Clock,
  CheckCircle, XCircle, AlertCircle, Heart, ThumbsUp, Download,
  Search, Filter, UserCheck, UserX, UserPlus, Trophy,
  Mail, Phone, MapPin, ExternalLink, Archive, Target
} from 'lucide-react';
import type { JobApplication, JobListing, Employee } from '@shared/schema';
import CompanyNavHeader from '@/components/company-nav-header';

interface ApplicationWithDetails extends JobApplication {
  job: JobListing;
  employee: Employee;
}

type ApplicationStatus = 'applied' | 'viewed' | 'shortlisted' | 'interviewed' | 'offered' | 'hired' | 'rejected' | 'withdrawn';

export default function CompanyRecruiterPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<ApplicationStatus | 'all'>('all');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('viewed');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Get all job applications for this company
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<ApplicationWithDetails[]>({
    queryKey: ['/api/company/applications'],
  });

  // Get company jobs for filtering
  const { data: companyJobs = [] } = useQuery<JobListing[]>({
    queryKey: ['/api/company/jobs'],
  });

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ applicationId, status, notes, rejectionReason }: { 
      applicationId: string; 
      status: ApplicationStatus; 
      notes?: string;
      rejectionReason?: string;
    }) => 
      apiRequest('PUT', `/api/company/applications/${applicationId}`, { 
        status, 
        companyNotes: notes,
        rejectionReason: rejectionReason
      }),
    onSuccess: () => {
      toast({ title: "Application status updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/company/applications'] });
      setSelectedApplication(null);
      setShowStatusDialog(false);
      setNotes('');
      setRejectionReason('');
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update application status", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      'applied': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'viewed': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'shortlisted': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'interviewed': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'offered': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'hired': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'withdrawn': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <Clock className="h-4 w-4" />;
      case 'viewed': return <Eye className="h-4 w-4" />;
      case 'shortlisted': return <Star className="h-4 w-4" />;
      case 'interviewed': return <MessageSquare className="h-4 w-4" />;
      case 'offered': return <ThumbsUp className="h-4 w-4" />;
      case 'hired': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Calculate counts for each status
  const statusCounts = {
    all: applications.length,
    applied: applications.filter(app => app.status === 'applied').length,
    viewed: applications.filter(app => app.status === 'viewed').length,
    shortlisted: applications.filter(app => app.status === 'shortlisted').length,
    interviewed: applications.filter(app => app.status === 'interviewed').length,
    offered: applications.filter(app => app.status === 'offered').length,
    hired: applications.filter(app => app.status === 'hired').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  // Filter applications based on tab, search, and job filter
  const filteredApplications = applications.filter((app: ApplicationWithDetails) => {
    // Status filter
    if (selectedTab !== 'all' && app.status !== selectedTab) return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const employeeName = `${app.employee.firstName} ${app.employee.lastName}`.toLowerCase();
      const jobTitle = app.job.title.toLowerCase();
      if (!employeeName.includes(searchLower) && !jobTitle.includes(searchLower) && !app.employee.email.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    // Job filter
    if (jobFilter !== 'all' && app.jobId !== jobFilter) return false;
    
    return true;
  });

  const handleStatusChange = (application: ApplicationWithDetails, newStatusValue: ApplicationStatus) => {
    setSelectedApplication(application);
    setNewStatus(newStatusValue);
    setNotes(application.companyNotes || '');
    setRejectionReason('');
    setShowStatusDialog(true);
  };

  const handleQuickStatusChange = (application: ApplicationWithDetails, status: ApplicationStatus) => {
    updateStatusMutation.mutate({
      applicationId: application.id,
      status,
      notes: application.companyNotes || ''
    });
  };

  const confirmStatusChange = () => {
    if (!selectedApplication) return;
    
    updateStatusMutation.mutate({
      applicationId: selectedApplication.id,
      status: newStatus,
      notes: notes.trim() || undefined,
      rejectionReason: newStatus === 'rejected' ? rejectionReason.trim() || undefined : undefined
    });
  };

  const getAvailableActions = (currentStatus: ApplicationStatus) => {
    switch (currentStatus) {
      case 'applied':
        return [
          { status: 'viewed' as ApplicationStatus, label: 'Mark as Viewed', icon: Eye, color: 'purple' },
          { status: 'rejected' as ApplicationStatus, label: 'Reject', icon: XCircle, color: 'red' }
        ];
      case 'viewed':
        return [
          { status: 'shortlisted' as ApplicationStatus, label: 'Shortlist', icon: Star, color: 'yellow' },
          { status: 'rejected' as ApplicationStatus, label: 'Reject', icon: XCircle, color: 'red' }
        ];
      case 'shortlisted':
        return [
          { status: 'interviewed' as ApplicationStatus, label: 'Mark Interviewed', icon: MessageSquare, color: 'orange' },
          { status: 'rejected' as ApplicationStatus, label: 'Reject', icon: XCircle, color: 'red' }
        ];
      case 'interviewed':
        return [
          { status: 'offered' as ApplicationStatus, label: 'Make Offer', icon: ThumbsUp, color: 'green' },
          { status: 'rejected' as ApplicationStatus, label: 'Reject', icon: XCircle, color: 'red' }
        ];
      case 'offered':
        return [
          { status: 'hired' as ApplicationStatus, label: 'Mark as Hired', icon: UserCheck, color: 'emerald' },
          { status: 'rejected' as ApplicationStatus, label: 'Mark Declined', icon: XCircle, color: 'red' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <CompanyNavHeader />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Recruiter Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage job applications and track recruitment progress
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{statusCounts.all}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.shortlisted}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Shortlisted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statusCounts.hired}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Hired</div>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-applications"
              />
            </div>
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-job-filter">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {companyJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Applications Tabs */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as ApplicationStatus | 'all')} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
            <TabsTrigger value="all" className="text-xs" data-testid="tab-all">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="applied" className="text-xs" data-testid="tab-new">
              New ({statusCounts.applied})
            </TabsTrigger>
            <TabsTrigger value="viewed" className="text-xs" data-testid="tab-viewed">
              Viewed ({statusCounts.viewed})
            </TabsTrigger>
            <TabsTrigger value="shortlisted" className="text-xs" data-testid="tab-shortlisted">
              Shortlisted ({statusCounts.shortlisted})
            </TabsTrigger>
            <TabsTrigger value="interviewed" className="text-xs" data-testid="tab-interviewed">
              Interviewed ({statusCounts.interviewed})
            </TabsTrigger>
            <TabsTrigger value="offered" className="text-xs" data-testid="tab-offered">
              Offered ({statusCounts.offered})
            </TabsTrigger>
            <TabsTrigger value="hired" className="text-xs" data-testid="tab-hired">
              Hired ({statusCounts.hired})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs" data-testid="tab-rejected">
              Rejected ({statusCounts.rejected})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4">
            {applicationsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No applications found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedTab === 'all' 
                      ? "No applications match your search criteria."
                      : `No ${selectedTab} applications at this time.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {application.employee.firstName?.[0]}{application.employee.lastName?.[0]}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {application.employee.firstName} {application.employee.lastName}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Applied for {application.job.title}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {application.employee.email}
                            </span>
                            {application.employee.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {application.employee.phone}
                              </span>
                            )}
                            {application.employee.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {application.employee.location}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-4">
                            <Badge className={`${getStatusBadgeColor(application.status)} text-xs flex items-center gap-1`}>
                              {getStatusIcon(application.status)}
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Applied {new Date(application.appliedAt).toLocaleDateString()}
                            </span>
                          </div>

                          {application.coverLetter && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                              {application.coverLetter}
                            </p>
                          )}

                          {application.companyNotes && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Company Notes:</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{application.companyNotes}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {/* Quick Action Buttons */}
                          {application.status !== 'hired' && application.status !== 'rejected' && (
                            <div className="flex flex-col gap-2">
                              {getAvailableActions(application.status as ApplicationStatus).map((action) => (
                                <Button
                                  key={action.status}
                                  size="sm"
                                  variant={action.color === 'red' ? 'destructive' : 'outline'}
                                  onClick={() => handleStatusChange(application, action.status)}
                                  className="text-xs whitespace-nowrap"
                                  data-testid={`button-${action.status}-${application.id}`}
                                >
                                  <action.icon className="h-3 w-3 mr-1" />
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}

                          {/* View Profile Link */}
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="text-xs"
                            data-testid={`button-view-profile-${application.id}`}
                          >
                            <Link href={`/employee-profile/${application.employee.id}`}>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Profile
                            </Link>
                          </Button>

                          {/* Download Resume */}
                          {application.resumeUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(application.resumeUrl, '_blank')}
                              className="text-xs"
                              data-testid={`button-download-resume-${application.id}`}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Resume
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Status Change Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Application Status</DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedApplication.employee.firstName} {selectedApplication.employee.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedApplication.job.title}
                  </p>
                </div>

                <div>
                  <Label htmlFor="status">New Status</Label>
                  <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ApplicationStatus)}>
                    <SelectTrigger data-testid="select-new-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewed">Viewed</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="interviewed">Interviewed</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newStatus === 'rejected' && (
                  <div>
                    <Label htmlFor="rejection-reason">Rejection Reason</Label>
                    <Select value={rejectionReason} onValueChange={setRejectionReason}>
                      <SelectTrigger data-testid="select-rejection-reason">
                        <SelectValue placeholder="Select reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="insufficient-experience">Insufficient Experience</SelectItem>
                        <SelectItem value="skills-mismatch">Skills Mismatch</SelectItem>
                        <SelectItem value="overqualified">Overqualified</SelectItem>
                        <SelectItem value="cultural-fit">Cultural Fit</SelectItem>
                        <SelectItem value="salary-expectations">Salary Expectations</SelectItem>
                        <SelectItem value="position-filled">Position Filled</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Company Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes about this candidate..."
                    rows={3}
                    data-testid="textarea-company-notes"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmStatusChange}
                disabled={updateStatusMutation.isPending}
                data-testid="button-confirm-status-change"
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}